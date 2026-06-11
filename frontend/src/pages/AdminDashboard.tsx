import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import { Users, Calendar, Clock, DollarSign, LogOut, User as UserIcon, FileText } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [onDutyStaff, setOnDutyStaff] = useState<any[]>([]);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayShifts: 0,
    onDuty: 0,
  });
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadOnDutyStaff, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([loadOnDutyStaff(), loadTodayShifts(), loadStats()]);
  };

  const loadOnDutyStaff = async () => {
    try {
      const response = await api.get('/clock/on-duty');
      setOnDutyStaff(response.data);
    } catch (error) {
      console.error('Failed to load on-duty staff:', error);
    }
  };

  const loadTodayShifts = async () => {
    try {
      const response = await api.get('/shifts', { params: { start_date: today, end_date: today } });
      setTodayShifts(response.data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [employeesRes, shiftsRes, onDutyRes] = await Promise.all([
        api.get('/users'),
        api.get('/shifts', { params: { start_date: today, end_date: today } }),
        api.get('/clock/on-duty'),
      ]);

      setStats({
        totalEmployees: employeesRes.data.filter((u: any) => u.role === 'employee').length,
        todayShifts: shiftsRes.data.length,
        onDuty: onDutyRes.data.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">☕ 管理员控制台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-500" />
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
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">员工总数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">当前在岗</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.onDuty}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">今日班次</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayShifts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 在岗人员 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              当前在岗人员 ({onDutyStaff.length})
            </h2>
            {onDutyStaff.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无在岗人员</p>
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
                      {staff.shift_start && (
                        <div className="text-xs text-gray-500">
                          排班: {staff.shift_start} - {staff.shift_end}
                        </div>
                      )}
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 今日排班 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              今日排班 ({todayShifts.length})
            </h2>
            {todayShifts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">今天没有排班</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {todayShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{shift.user_name}</div>
                      <div className="text-sm text-gray-500">
                        {shift.start_time} - {shift.end_time}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      shift.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      shift.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shift.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <a
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">员工管理</span>
          </a>
          <a
            href="/admin/scheduling"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          >
            <Calendar className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">排班管理</span>
          </a>
          <a
            href="/admin/requests"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          >
            <FileText className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">请假审批</span>
          </a>
          <a
            href="/admin/clock-records"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          >
            <Clock className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">打卡记录</span>
          </a>
          <a
            href="/admin/payroll"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          >
            <DollarSign className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">工资管理</span>
          </a>
        </div>
      </div>
    </div>
  );
}
