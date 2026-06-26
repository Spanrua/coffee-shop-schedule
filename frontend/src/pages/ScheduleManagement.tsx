import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Users, Plus, Sparkles, Clock, X } from 'lucide-react';
import api from '../services/api';
import StoreSelector from '../components/StoreSelector';
import type { AvailableTime, Store, User } from '../types';

interface AvailableTimeWithUser extends AvailableTime {
  user_name: string;
  username: string;
}

interface ScheduleSlot {
  id?: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  user_name?: string;
  username?: string;
  status?: string;
}

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export default function ScheduleManagement() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [availableTimes, setAvailableTimes] = useState<AvailableTimeWithUser[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAvailablePanel, setShowAvailablePanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEmployeeAvailable, setSelectedEmployeeAvailable] = useState<{
    start_time: string;
    end_time: string;
  } | null>(null);
  const [newShift, setNewShift] = useState({
    user_id: '',
    date: '',
    start_time: '09:00',
    end_time: '17:00',
  });

  const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
  const weekEndStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      fetchData();
    }
  }, [currentWeekStart, selectedStoreId]);

  const fetchStores = async () => {
    const response = await api.get('/stores');
    const storeList = response.data as Store[];
    setStores(storeList);
    if (storeList.length > 0) {
      setSelectedStoreId(storeList[0].id);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAvailableTimes(),
        fetchSchedules(),
        fetchEmployees(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    try {
      const response = await api.get(`/available-times/all/${weekStartStr}`, {
        params: { store_id: selectedStoreId },
      });
      setAvailableTimes(response.data);
    } catch (error) {
      console.error('Failed to fetch available times:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/shifts', {
        params: {
          start_date: weekStartStr,
          end_date: weekEndStr,
          store_id: selectedStoreId,
        },
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(
        response.data.filter((u: User) =>
          u.role === 'employee' &&
          u.status === 'active' &&
          (u.primary_store_id === selectedStoreId || u.support_store_ids?.includes(Number(selectedStoreId)))
        )
      );
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedStoreId) {
      alert('请先选择门店');
      return;
    }

    if (!confirm('自动生成排班会覆盖本周现有的排班，确定继续吗？')) {
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/shifts/generate', {
        week_start_date: weekStartStr,
        store_id: selectedStoreId,
      });

      const result = response.data;
      alert(`成功生成 ${result.shifts_count} 个班次！${result.warnings ? '\n\n警告：\n' + result.warnings.join('\n') : ''}`);
      await fetchSchedules();
    } catch (error: any) {
      console.error('Generate failed:', error);
      alert(error.response?.data?.error || '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddShift = async () => {
    if (!selectedStoreId) {
      alert('请先选择门店');
      return;
    }

    if (!newShift.user_id || !newShift.date || !newShift.start_time || !newShift.end_time) {
      alert('请填写完整信息');
      return;
    }

    if (newShift.start_time >= newShift.end_time) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    // 验证时间是否在员工可用时间范围内
    if (selectedEmployeeAvailable) {
      const startInRange = newShift.start_time >= selectedEmployeeAvailable.start_time;
      const endInRange = newShift.end_time <= selectedEmployeeAvailable.end_time;

      if (!startInRange || !endInRange) {
        if (!confirm(
          `选择的时间超出了员工的可用时间范围（${selectedEmployeeAvailable.start_time}-${selectedEmployeeAvailable.end_time}）。\n确定要继续吗？`
        )) {
          return;
        }
      }
    }

    try {
      await api.post('/shifts', {
        user_id: parseInt(newShift.user_id),
        store_id: selectedStoreId,
        date: newShift.date,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
      });

      alert('班次添加成功！');
      setShowAddModal(false);
      setSelectedEmployeeAvailable(null);
      setNewShift({
        user_id: '',
        date: '',
        start_time: '09:00',
        end_time: '17:00',
      });
      await fetchSchedules();
    } catch (error: any) {
      console.error('Add shift failed:', error);
      alert(error.response?.data?.error || '添加失败，请重试');
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!confirm('确定要删除这个班次吗？')) {
      return;
    }

    try {
      await api.delete(`/shifts/${shiftId}`);

      await fetchSchedules();
    } catch (error: any) {
      console.error('Delete shift failed:', error);
      alert(error.response?.data?.error || '删除失败，请重试');
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  // 获取某个日期和时间段内的排班
  const getShiftsInTimeSlot = (dateStr: string, timeSlot: string) => {
    return schedules.filter(s => {
      if (s.date !== dateStr) return false;
      // 检查班次是否在这个时间段内
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const startHour = parseInt(s.start_time.split(':')[0]);
      const endHour = parseInt(s.end_time.split(':')[0]);
      return startHour <= slotHour && slotHour < endHour;
    });
  };

  // 获取某个日期某天可用的员工
  const getAvailableEmployeesForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    return availableTimes.filter(at => at.day_of_week === dayOfWeek);
  };

  // 统计数据
  const totalShifts = schedules.length;
  const totalEmployees = new Set(schedules.map(s => s.user_id)).size;
  const totalHours = schedules.reduce((sum, s) => {
    const start = new Date(`2000-01-01 ${s.start_time}`);
    const end = new Date(`2000-01-01 ${s.end_time}`);
    return sum + (end.getTime() - start.getTime()) / 3600000;
  }, 0);

  const openQuickAdd = (dateStr: string, time: string) => {
    setNewShift({
      ...newShift,
      date: dateStr,
      start_time: time,
      end_time: format(new Date(`2000-01-01 ${time}`).getTime() + 3600000 * 4, 'HH:mm'),
    });
    setSelectedEmployeeAvailable(null);
    setShowAddModal(true);
  };

  const showAvailableEmployees = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowAvailablePanel(true);
  };

  // 生成时间选项（每半小时一个选项）
  const generateTimeOptions = (start?: string, end?: string) => {
    const options: string[] = [];
    const startHour = start ? parseInt(start.split(':')[0]) : 6;
    const endHour = end ? parseInt(end.split(':')[0]) + 1 : 24;

    for (let hour = startHour; hour < endHour; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour - 1 || (end && end.split(':')[1] !== '00')) {
        options.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return options;
  };

  // 快速选择时段
  const applyQuickTime = (type: 'morning' | 'afternoon' | 'full') => {
    if (!selectedEmployeeAvailable) {
      alert('请先选择员工和日期');
      return;
    }

    const availStart = selectedEmployeeAvailable.start_time;
    const availEnd = selectedEmployeeAvailable.end_time;
    const availStartHour = parseInt(availStart.split(':')[0]);
    const availEndHour = parseInt(availEnd.split(':')[0]);
    const midPoint = Math.floor((availStartHour + availEndHour) / 2);

    switch (type) {
      case 'morning':
        // 上午班：可用时间前半段
        setNewShift({
          ...newShift,
          start_time: availStart,
          end_time: `${midPoint.toString().padStart(2, '0')}:00`,
        });
        break;
      case 'afternoon':
        // 下午班：可用时间后半段
        setNewShift({
          ...newShift,
          start_time: `${midPoint.toString().padStart(2, '0')}:00`,
          end_time: availEnd,
        });
        break;
      case 'full':
        // 全天班：完整可用时间
        setNewShift({
          ...newShift,
          start_time: availStart,
          end_time: availEnd,
        });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* 标题和操作 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回控制台"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📅 排班日历</h1>
            </div>
          </div>
          <p className="text-gray-600 ml-14">可视化查看和管理员工排班</p>
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <StoreSelector
              stores={stores}
              value={selectedStoreId}
              onChange={(storeId) => setSelectedStoreId(storeId)}
            />
            <button
              onClick={() => {
                setNewShift({
                  user_id: '',
                  date: weekStartStr,
                  start_time: '09:00',
                  end_time: '17:00',
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              添加班次
            </button>
            <button
              onClick={handleAutoGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              {generating ? '生成中...' : '自动生成'}
            </button>
          </div>
        </div>

        {/* 周选择器 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-xl font-semibold">
                    {format(currentWeekStart, 'yyyy年M月d日', { locale: zhCN })} - {' '}
                    {format(addDays(currentWeekStart, 6), 'M月d日', { locale: zhCN })}
                  </span>
                </div>
              </div>

              <button
                onClick={goToThisWeek}
                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                本周
              </button>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">本周班次</p>
                <p className="text-4xl font-bold">{totalShifts}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">参与员工</p>
                <p className="text-4xl font-bold">{totalEmployees}</p>
              </div>
              <Users className="w-12 h-12 text-green-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1">总工时</p>
                <p className="text-4xl font-bold">{totalHours.toFixed(0)}</p>
              </div>
              <Clock className="w-12 h-12 text-purple-200 opacity-80" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : (
          <>
            {/* 日历网格 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <th className="border border-gray-200 p-3 w-20 sticky left-0 bg-gray-50 z-10">
                        <Clock className="w-5 h-5 mx-auto text-gray-600" />
                        <span className="sr-only">时间</span>
                      </th>
                      {DAYS.map((dayName, dayIndex) => {
                        const currentDate = addDays(currentWeekStart, dayIndex);
                        const dateStr = format(currentDate, 'yyyy-MM-dd');
                        const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                        const daySchedules = schedules.filter(s => s.date === dateStr);
                        const availableCount = getAvailableEmployeesForDate(dateStr).length;

                        return (
                          <th
                            key={dayIndex}
                            className={`border border-gray-200 p-3 ${
                              isToday ? 'bg-blue-100' : ''
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 text-lg">
                                {dayName}
                                {isToday && <span className="text-blue-600 text-sm ml-1">今天</span>}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {format(currentDate, 'M月d日', { locale: zhCN })}
                              </div>
                              <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                                <span className="text-green-600 font-medium">
                                  {daySchedules.length} 班次
                                </span>
                                <button
                                  onClick={() => showAvailableEmployees(dateStr)}
                                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Users className="w-3 h-3" />
                                  {availableCount} 可用
                                </button>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((timeSlot, timeIndex) => (
                      <tr key={timeIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2 text-center font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                          {timeSlot}
                        </td>
                        {DAYS.map((_, dayIndex) => {
                          const currentDate = addDays(currentWeekStart, dayIndex);
                          const dateStr = format(currentDate, 'yyyy-MM-dd');
                          const shiftsInSlot = getShiftsInTimeSlot(dateStr, timeSlot);

                          return (
                            <td
                              key={dayIndex}
                              className="border border-gray-200 p-1 align-top relative group cursor-pointer hover:bg-blue-50"
                              onClick={() => openQuickAdd(dateStr, timeSlot)}
                            >
                              <div className="min-h-[60px] relative">
                                {shiftsInSlot.length === 0 ? (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-gray-400" />
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {shiftsInSlot.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className="bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded p-1.5 text-xs group/shift relative"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-start justify-between gap-1">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">
                                              {shift.user_name}
                                            </div>
                                            <div className="text-gray-600 text-[10px]">
                                              {shift.start_time}-{shift.end_time}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteShift(shift.id!)}
                                            className="opacity-0 group-hover/shift:opacity-100 p-0.5 hover:bg-red-100 rounded transition-all"
                                            type="button"
                                            title="删除班次"
                                            aria-label="删除班次"
                                          >
                                            <X className="w-3 h-3 text-red-600" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 图例 */}
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded"></div>
                <span>已排班</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-gray-200 rounded"></div>
                <span>空闲时段（点击添加）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span>今天</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 添加班次模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">添加班次</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择员工
                </label>
                <select
                  value={newShift.user_id}
                  onChange={(e) => {
                    const userId = e.target.value;
                    setNewShift({ ...newShift, user_id: userId });

                    // 当选择员工且已选择日期时，自动显示该员工在该日期的可用时间范围
                    if (userId && newShift.date) {
                      const date = new Date(newShift.date);
                      const dayOfWeek = date.getDay();
                      const employeeAvailable = availableTimes.find(
                        at => at.user_id === parseInt(userId) && at.day_of_week === dayOfWeek
                      );
                      if (employeeAvailable) {
                        // 不自动填充，让管理员自己选择
                        // 但可以在下方显示提示
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">选择员工</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (@{emp.username})
                    </option>
                  ))}
                </select>
                {newShift.user_id && newShift.date && (() => {
                  const date = new Date(newShift.date);
                  const dayOfWeek = date.getDay();
                  const employeeAvailable = availableTimes.find(
                    at => at.user_id === parseInt(newShift.user_id) && at.day_of_week === dayOfWeek
                  );
                  if (employeeAvailable) {
                    return (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="text-sm text-green-700 mb-2">
                          <span className="font-medium">✓ 员工可用时间：</span>
                          <span className="font-semibold">
                            {employeeAvailable.start_time} - {employeeAvailable.end_time}
                          </span>
                        </div>
                        {/* 快捷选择按钮 */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => applyQuickTime('morning')}
                            className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            上午班
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickTime('afternoon')}
                            className="flex-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          >
                            下午班
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickTime('full')}
                            className="flex-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            全天班
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <span className="text-yellow-700">
                          ⚠️ 该员工在此日期未提交可用时间
                        </span>
                      </div>
                    );
                  }
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期
                </label>
                <input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                  min={weekStartStr}
                  max={weekEndStr}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <select
                    value={newShift.start_time}
                    onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {generateTimeOptions(
                      selectedEmployeeAvailable?.start_time,
                      selectedEmployeeAvailable?.end_time
                    ).map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间
                  </label>
                  <select
                    value={newShift.end_time}
                    onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {generateTimeOptions(
                      selectedEmployeeAvailable?.start_time,
                      selectedEmployeeAvailable?.end_time
                    ).map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 时间验证提示 */}
              {newShift.start_time && newShift.end_time && selectedEmployeeAvailable && (
                (newShift.start_time < selectedEmployeeAvailable.start_time ||
                 newShift.end_time > selectedEmployeeAvailable.end_time) && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ 选择的时间超出员工可用范围
                  </div>
                )
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddShift}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 可用员工侧边栏 */}
      {showAvailablePanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50" onClick={() => setShowAvailablePanel(false)}>
          <div className="bg-white h-full w-96 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {format(new Date(selectedDate), 'M月d日 可用员工', { locale: zhCN })}
                </h3>
                <button
                  onClick={() => setShowAvailablePanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {getAvailableEmployeesForDate(selectedDate).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>该日暂无员工提交可用时间</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getAvailableEmployeesForDate(selectedDate).map((at, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{at.user_name}</p>
                          <p className="text-sm text-gray-600">@{at.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-600">
                          {at.start_time} - {at.end_time}
                        </span>
                        <span className="text-gray-500">
                          ({((new Date(`2000-01-01 ${at.end_time}`) as any) - (new Date(`2000-01-01 ${at.start_time}`) as any)) / 3600000}h)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setNewShift({
                            user_id: at.user_id?.toString() || '',
                            date: selectedDate,
                            start_time: at.start_time,
                            end_time: at.end_time,
                          });
                          setShowAvailablePanel(false);
                          setShowAddModal(true);
                        }}
                        className="mt-3 w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        安排此时段
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
