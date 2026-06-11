import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DollarSign, ArrowLeft, Calendar, Download, User, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface PayrollRecord {
  user_id: number;
  name: string;
  username: string;
  hourly_rate: number;
  total_hours: number;
  regular_pay: number;
  overtime_pay: number;
  weekend_pay: number;
  total_pay: number;
  daily_records: DailyRecord[];
}

interface DailyRecord {
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  actual_hours: number;
  is_weekend: boolean;
  is_missing_clock: boolean;
  daily_pay: number;
}

export default function PayrollManagement() {
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPayroll();
  }, [startDate, endDate]);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payroll', {
        params: { start_date: startDate, end_date: endDate },
      });
      setPayrollData(response.data);
    } catch (error) {
      console.error('Failed to load payroll:', error);
      alert('加载工资数据失败');
    } finally {
      setLoading(false);
    }
  };

  const setThisMonth = () => {
    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  const setLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      setExporting(true);
      const response = await api.get('/payroll/export', {
        params: { start_date: startDate, end_date: endDate, format },
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll_${startDate}_${endDate}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const totalStats = payrollData.reduce(
    (acc, record) => ({
      totalPay: acc.totalPay + record.total_pay,
      totalHours: acc.totalHours + record.total_hours,
      totalEmployees: acc.totalEmployees + 1,
    }),
    { totalPay: 0, totalHours: 0, totalEmployees: 0 }
  );

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900">工资管理</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总工资</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ¥{totalStats.totalPay.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总工时</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStats.totalHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">员工数量</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStats.totalEmployees}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 日期筛选和导出 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  结束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 items-end">
                <button
                  onClick={setThisMonth}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  本月
                </button>
                <button
                  onClick={setLastMonth}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  上月
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting || payrollData.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <Download className="w-4 h-4" />
                <span>导出Excel</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting || payrollData.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Download className="w-4 h-4" />
                <span>导出CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* 工资列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  员工
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时薪
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总工时
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  正常工资
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加班工资
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  周末工资
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总工资
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    所选时间段内没有工资数据
                  </td>
                </tr>
              ) : (
                payrollData.map((record) => (
                  <>
                    <tr key={record.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-xs text-gray-500">{record.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{record.hourly_rate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.total_hours.toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{record.regular_pay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        ¥{record.overtime_pay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                        ¥{record.weekend_pay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ¥{record.total_pay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            setExpandedUserId(
                              expandedUserId === record.user_id ? null : record.user_id
                            )
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {expandedUserId === record.user_id ? '收起' : '查看明细'}
                        </button>
                      </td>
                    </tr>
                    {expandedUserId === record.user_id && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm font-medium text-gray-900 mb-3">
                            {record.name} - 每日工作明细
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    日期
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    上班
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    下班
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    工时
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    类型
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    当日工资
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {record.daily_records.map((daily, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {daily.date}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                      {formatTime(daily.clock_in_time)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                      {formatTime(daily.clock_out_time)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {daily.actual_hours.toFixed(2)}h
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          daily.is_weekend
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {daily.is_weekend ? '周末' : '工作日'}
                                      </span>
                                      {daily.is_missing_clock && (
                                        <span className="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                          估算
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-sm font-medium text-green-600">
                                      ¥{daily.daily_pay.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 计算说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">工资计算说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 工作日：前8小时按正常时薪，超过8小时按1.5倍加班费</li>
            <li>• 周末：全天按1.5倍计算</li>
            <li>• 周总工时超过40小时，超出部分额外按2.0倍计算</li>
            <li>• 如果员工未打卡但有排班，则按排班时间估算工资（标记为"估算"）</li>
            <li>• 导出功能支持Excel和CSV格式，包含汇总和明细数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
