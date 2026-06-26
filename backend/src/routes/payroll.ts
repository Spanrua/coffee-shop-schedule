import { Router } from 'express';
import ExcelJS from 'exceljs';
import db from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { format, parseISO, differenceInHours, getDay } from 'date-fns';
import { buildStoreFilter, getManageableStoreContext, requireManageableStore } from '../utils/storeAccess';

const router = Router();

// 计算工资
function calculatePayroll(startDate: string, endDate: string, userId?: number, storeIds?: number[]) {
  // 获取系统配置
  const settings = db.prepare('SELECT setting_key, setting_value FROM system_settings').all() as any[];
  const config: any = {};
  settings.forEach(s => {
    config[s.setting_key] = parseFloat(s.setting_value) || s.setting_value;
  });

  const overtimeDailyThreshold = config.overtime_daily_threshold || 8;
  const overtimeDailyMultiplier = config.overtime_daily_multiplier || 1.5;
  const overtimeWeeklyThreshold = config.overtime_weekly_threshold || 40;
  const overtimeWeeklyMultiplier = config.overtime_weekly_multiplier || 2.0;
  const weekendMultiplier = config.weekend_multiplier || 1.5;

  // 获取打卡记录
  let query = `
    SELECT cr.*, u.id as user_id, u.name, u.username, u.hourly_rate,
           s.start_time as shift_start, s.end_time as shift_end
    FROM clock_records cr
    JOIN users u ON cr.user_id = u.id
    LEFT JOIN shifts s ON cr.shift_id = s.id
    WHERE cr.date BETWEEN ? AND ?
  `;
  const params: any[] = [startDate, endDate];

  if (userId) {
    query += ' AND cr.user_id = ?';
    params.push(userId);
  }
  if (storeIds && storeIds.length > 0) {
    query += ` AND cr.store_id IN (${storeIds.map(() => '?').join(', ')})`;
    params.push(...storeIds);
  }

  query += ' ORDER BY u.id, cr.date, cr.clock_in_time';

  const records = db.prepare(query).all(...params) as any[];

  // 按员工分组计算
  const userPayroll: any = {};

  records.forEach(record => {
    if (!userPayroll[record.user_id]) {
      userPayroll[record.user_id] = {
        user_id: record.user_id,
        name: record.name,
        username: record.username,
        hourly_rate: record.hourly_rate,
        daily_records: [],
        total_hours: 0,
        regular_pay: 0,
        overtime_pay: 0,
        weekend_pay: 0,
        total_pay: 0,
      };
    }

    // 计算实际工作时间
    let actualHours = 0;
    let isMissingClock = false;

    if (record.clock_in_time && record.clock_out_time) {
      const clockIn = parseISO(record.clock_in_time);
      const clockOut = parseISO(record.clock_out_time);
      actualHours = differenceInHours(clockOut, clockIn, { roundingMethod: 'round' });
    } else if (record.shift_start && record.shift_end) {
      // 使用排班时间估算
      const shiftStart = parseISO(`${record.date}T${record.shift_start}`);
      const shiftEnd = parseISO(`${record.date}T${record.shift_end}`);
      actualHours = differenceInHours(shiftEnd, shiftStart);
      isMissingClock = true;
    }

    if (actualHours > 0) {
      const dayOfWeek = getDay(parseISO(record.date));
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let dailyPay = 0;
      let regularHours = 0;
      let overtimeHours = 0;

      if (isWeekend) {
        // 周末全部按倍数计算
        dailyPay = actualHours * record.hourly_rate * weekendMultiplier;
        userPayroll[record.user_id].weekend_pay += dailyPay;
      } else {
        // 工作日：前8小时正常，超过8小时按加班计算
        if (actualHours <= overtimeDailyThreshold) {
          regularHours = actualHours;
          dailyPay = actualHours * record.hourly_rate;
          userPayroll[record.user_id].regular_pay += dailyPay;
        } else {
          regularHours = overtimeDailyThreshold;
          overtimeHours = actualHours - overtimeDailyThreshold;
          const regularPay = regularHours * record.hourly_rate;
          const overtimePay = overtimeHours * record.hourly_rate * overtimeDailyMultiplier;
          dailyPay = regularPay + overtimePay;
          userPayroll[record.user_id].regular_pay += regularPay;
          userPayroll[record.user_id].overtime_pay += overtimePay;
        }
      }

      userPayroll[record.user_id].daily_records.push({
        date: record.date,
        clock_in_time: record.clock_in_time,
        clock_out_time: record.clock_out_time,
        actual_hours: actualHours,
        is_weekend: isWeekend,
        is_missing_clock: isMissingClock,
        daily_pay: dailyPay,
      });

      userPayroll[record.user_id].total_hours += actualHours;
    }
  });

  // 计算周总工时加班费
  Object.values(userPayroll).forEach((user: any) => {
    if (user.total_hours > overtimeWeeklyThreshold) {
      const weeklyOvertimeHours = user.total_hours - overtimeWeeklyThreshold;
      const weeklyOvertimePay = weeklyOvertimeHours * user.hourly_rate * (overtimeWeeklyMultiplier - 1);
      user.overtime_pay += weeklyOvertimePay;
    }

    user.total_pay = user.regular_pay + user.overtime_pay + user.weekend_pay;
  });

  return Object.values(userPayroll);
}

// 查询工资数据
router.get('/', authenticate, (req: AuthRequest, res) => {
  const { start_date, end_date, user_id } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  try {
    let storeIds: number[] | undefined;
    if (req.user!.role === 'admin') {
      const storeId = requireManageableStore(req, req.query.store_id);
      storeIds = storeId ? [storeId] : getManageableStoreContext(req).storeIds;
    }

    const targetUserId = req.user!.role === 'admin' ? (user_id ? parseInt(user_id as string) : undefined) : req.user!.userId;
    const payroll = calculatePayroll(start_date as string, end_date as string, targetUserId, storeIds);

    res.json(payroll);
  } catch (error: any) {
    console.error('Get payroll error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get payroll' });
  }
});

// 导出工资表
router.get('/export', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { start_date, end_date, format: exportFormat } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  try {
    const storeId = requireManageableStore(req, req.query.store_id);
    const storeIds = storeId ? [storeId] : getManageableStoreContext(req).storeIds;
    const payroll = calculatePayroll(start_date as string, end_date as string, undefined, storeIds);

    if (exportFormat === 'csv') {
      // CSV 导出
      let csv = '姓名,用户名,时薪,总工时,正常工资,加班工资,周末工资,总工资\n';

      payroll.forEach((user: any) => {
        csv += `${user.name},${user.username},${user.hourly_rate},${user.total_hours.toFixed(2)},${user.regular_pay.toFixed(2)},${user.overtime_pay.toFixed(2)},${user.weekend_pay.toFixed(2)},${user.total_pay.toFixed(2)}\n`;
      });

      // 明细
      csv += '\n\n明细\n';
      csv += '姓名,日期,上班时间,下班时间,工时,是否周末,是否未打卡,当日工资\n';

      payroll.forEach((user: any) => {
        user.daily_records.forEach((record: any) => {
          csv += `${user.name},${record.date},${record.clock_in_time || ''},${record.clock_out_time || ''},${record.actual_hours.toFixed(2)},${record.is_weekend ? '是' : '否'},${record.is_missing_clock ? '是' : '否'},${record.daily_pay.toFixed(2)}\n`;
        });
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=payroll_${start_date}_${end_date}.csv`);
      res.send('﻿' + csv); // UTF-8 BOM
    } else {
      // Excel 导出
      const workbook = new ExcelJS.Workbook();
      const summarySheet = workbook.addWorksheet('工资汇总');
      const detailSheet = workbook.addWorksheet('明细');

      // 汇总表
      summarySheet.columns = [
        { header: '姓名', key: 'name', width: 15 },
        { header: '用户名', key: 'username', width: 15 },
        { header: '时薪', key: 'hourly_rate', width: 10 },
        { header: '总工时', key: 'total_hours', width: 10 },
        { header: '正常工资', key: 'regular_pay', width: 12 },
        { header: '加班工资', key: 'overtime_pay', width: 12 },
        { header: '周末工资', key: 'weekend_pay', width: 12 },
        { header: '总工资', key: 'total_pay', width: 12 },
      ];

      payroll.forEach((user: any) => {
        summarySheet.addRow({
          name: user.name,
          username: user.username,
          hourly_rate: user.hourly_rate,
          total_hours: parseFloat(user.total_hours.toFixed(2)),
          regular_pay: parseFloat(user.regular_pay.toFixed(2)),
          overtime_pay: parseFloat(user.overtime_pay.toFixed(2)),
          weekend_pay: parseFloat(user.weekend_pay.toFixed(2)),
          total_pay: parseFloat(user.total_pay.toFixed(2)),
        });
      });

      // 明细表
      detailSheet.columns = [
        { header: '姓名', key: 'name', width: 15 },
        { header: '日期', key: 'date', width: 12 },
        { header: '上班时间', key: 'clock_in_time', width: 20 },
        { header: '下班时间', key: 'clock_out_time', width: 20 },
        { header: '工时', key: 'actual_hours', width: 10 },
        { header: '是否周末', key: 'is_weekend', width: 10 },
        { header: '是否未打卡', key: 'is_missing_clock', width: 12 },
        { header: '当日工资', key: 'daily_pay', width: 12 },
      ];

      payroll.forEach((user: any) => {
        user.daily_records.forEach((record: any) => {
          detailSheet.addRow({
            name: user.name,
            date: record.date,
            clock_in_time: record.clock_in_time || '',
            clock_out_time: record.clock_out_time || '',
            actual_hours: parseFloat(record.actual_hours.toFixed(2)),
            is_weekend: record.is_weekend ? '是' : '否',
            is_missing_clock: record.is_missing_clock ? '是' : '否',
            daily_pay: parseFloat(record.daily_pay.toFixed(2)),
          });
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=payroll_${start_date}_${end_date}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error: any) {
    console.error('Export payroll error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to export payroll' });
  }
});

export default router;
