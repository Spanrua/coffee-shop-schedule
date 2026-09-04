import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { Shift, ClockRecord } from '../types';
import { format } from 'date-fns';
import { Clock, LogOut, Calendar, User, FileText, DollarSign, ClipboardList } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [clockRecords, setClockRecords] = useState<ClockRecord[]>([]);
  const [onDutyStaff, setOnDutyStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
    // 每30秒刷新一次在岗人员
    const interval = setInterval(loadOnDutyStaff, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([loadTodayShifts(), loadTodayClockRecords(), loadOnDutyStaff()]);
  };

  const loadTodayShifts = async () => {
    try {
      const response = await api.get('/shifts/today');
      setTodayShifts(response.data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const loadTodayClockRecords = async () => {
    try {
      const response = await api.get('/clock/today');
      setClockRecords(response.data);
    } catch (error) {
      console.error('Failed to load clock records:', error);
    }
  };

  const loadOnDutyStaff = async () => {
    try {
      const response = await api.get('/clock/on-duty');
      setOnDutyStaff(response.data);
    } catch (error) {
      console.error('Failed to load on-duty staff:', error);
    }
  };

  const handleClockIn = async (shiftId: number) => {
    setLoading(true);
    try {
      await api.post('/clock/in', { shift_id: shiftId });
      alert('上班打卡成功！');
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (recordId: number) => {
    setLoading(true);
    try {
      await api.post('/clock/out', { clock_record_id: recordId });
      alert('下班打卡成功！');
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const getClockRecordForShift = (shiftId: number) => {
    return clockRecords.find(r => r.shift_id === shiftId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">☕ 员工工作台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                type="button"
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span>退出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 今日班次与打卡 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                今日班次 ({today})
              </h2>

              {todayShifts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">今天没有排班</p>
              ) : (
                <div className="space-y-4">
                  {todayShifts.map((shift) => {
                    const record = getClockRecordForShift(shift.id);
                    const hasClockedIn = record && record.clock_in_time;
                    const hasClockedOut = record && record.clock_out_time;

                    return (
                      <div
                        key={shift.id}
                        className={`border rounded-lg p-4 ${
                          record?.is_anomaly ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-lg font-medium text-gray-900">
                              {shift.start_time} - {shift.end_time}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              状态: {shift.status === 'scheduled' ? '已排班' : shift.status}
                            </div>
                          </div>
                          {record?.is_anomaly && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              异常
                            </span>
                          )}
                        </div>

                        {hasClockedIn && (
                          <div className="text-sm text-gray-600 mb-3">
                            <p>✓ 上班打卡: {record.clock_in_time ? format(new Date(record.clock_in_time), 'HH:mm:ss') : ''}</p>
                            {hasClockedOut && (
                              <p>✓ 下班打卡: {record.clock_out_time ? format(new Date(record.clock_out_time), 'HH:mm:ss') : ''}</p>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {!hasClockedIn && (
                            <button
                              onClick={() => handleClockIn(shift.id)}
                              disabled={loading}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
                            >
                              <Clock className="w-4 h-4 inline mr-1" />
                              上班打卡
                            </button>
                          )}
                          {hasClockedIn && !hasClockedOut && record && (
                            <button
                              onClick={() => handleClockOut(record.id)}
                              disabled={loading}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
                            >
                              <Clock className="w-4 h-4 inline mr-1" />
                              下班打卡
                            </button>
                          )}
                          {hasClockedOut && (
                            <div className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium text-center">
                              已完成打卡
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 当前在岗人员 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                当前在岗人员 ({onDutyStaff.length})
              </h2>
              {onDutyStaff.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无在岗人员</p>
              ) : (
                <div className="space-y-3">
                  {onDutyStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{staff.user_name}</div>
                        <div className="text-xs text-gray-500">
                          上班时间: {staff.clock_in_time ? format(new Date(staff.clock_in_time), 'HH:mm') : ''}
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 快捷菜单 */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷菜单</h2>
              <div className="space-y-2">
                <a
                  href="#/employee/available-times"
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">提交可用时间</div>
                    <div className="text-xs text-gray-500">告诉管理员你的空闲时段</div>
                  </div>
                </a>
                <a
                  href="#/employee/schedule"
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">查看排班</div>
                    <div className="text-xs text-gray-500">查看本周和未来排班</div>
                  </div>
                </a>
                <a
                  href="#/employee/requests"
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">请假/调班</div>
                    <div className="text-xs text-gray-500">提交请假或调班申请</div>
                  </div>
                </a>
                <a
                  href="#/employee/clock-records"
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">打卡记录</div>
                    <div className="text-xs text-gray-500">查看历史打卡记录</div>
                  </div>
                </a>
                <a
                  href="#/employee/payroll"
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-yellow-50 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">我的工时</div>
                    <div className="text-xs text-gray-500">查看工时明细和统计</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
