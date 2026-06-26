import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import api from '../services/api';
import type { Shift } from '../types';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function EmployeeSchedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
  const weekEndStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

  useEffect(() => {
    fetchShifts();
  }, [currentWeekStart]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shifts/my', {
        params: { start_date: weekStartStr, end_date: weekEndStr },
      });
      setShifts(response.data);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
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

  // 按日期分组班次
  const shiftsByDate: { [key: string]: Shift[] } = {};
  shifts.forEach(shift => {
    if (!shiftsByDate[shift.date]) {
      shiftsByDate[shift.date] = [];
    }
    shiftsByDate[shift.date].push(shift);
  });

  // 计算统计数据
  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((sum, s) => {
    const start = new Date(`2000-01-01 ${s.start_time}`);
    const end = new Date(`2000-01-01 ${s.end_time}`);
    return sum + (end.getTime() - start.getTime()) / 3600000;
  }, 0);
  const workDays = Object.keys(shiftsByDate).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/employee"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回工作台"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的排班</h1>
            </div>
          </div>
          <p className="text-gray-600 ml-14">查看你的工作排班安排</p>
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
                <p className="text-sm text-gray-500">
                  第 {format(currentWeekStart, 'w', { locale: zhCN })} 周
                </p>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">工作天数</p>
                <p className="text-3xl font-bold text-blue-600">{workDays}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">班次数量</p>
                <p className="text-3xl font-bold text-green-600">{totalShifts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总工时</p>
                <p className="text-3xl font-bold text-purple-600">{totalHours.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
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
            {/* 每日排班 */}
            <div className="space-y-4">
              {DAYS.map((dayName, dayIndex) => {
                const currentDate = addDays(currentWeekStart, dayIndex);
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const dayShifts = shiftsByDate[dateStr] || [];
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

                return (
                  <div
                    key={dayIndex}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                      isToday ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className={`p-4 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {dayName}
                              {isToday && (
                                <span className="ml-2 text-sm text-blue-600 font-normal">
                                  （今天）
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {format(currentDate, 'M月d日', { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {dayShifts.length > 0 ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {dayShifts.length} 个班次
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                              休息
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {dayShifts.length > 0 && (
                      <div className="p-4 space-y-3">
                        {dayShifts.map((shift) => {
                          const start = new Date(`2000-01-01 ${shift.start_time}`);
                          const end = new Date(`2000-01-01 ${shift.end_time}`);
                          const hours = (end.getTime() - start.getTime()) / 3600000;

                          return (
                            <div
                              key={shift.id}
                              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold text-gray-900">
                                      {shift.start_time} - {shift.end_time}
                                    </p>
                                    {shift.store_name && (
                                      <p className="text-sm text-blue-600">{shift.store_name}</p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                      工作时长：{hours.toFixed(1)} 小时
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                    shift.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                    shift.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {shift.status === 'scheduled' ? '已安排' :
                                     shift.status === 'confirmed' ? '已确认' :
                                     '已取消'}
                                  </div>
                                  {shift.notes && (
                                    <p className="text-sm text-gray-500 mt-1">{shift.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {shifts.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">本周暂无排班</h3>
                <p className="text-gray-600">
                  请先在"可用时间"页面提交你的可用时间，方便管理员安排排班
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
