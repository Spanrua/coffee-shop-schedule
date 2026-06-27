import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Plus, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import StoreSelector from '../components/StoreSelector';
import type { AvailableTime, Store } from '../types';

interface TimeSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function AvailableTimes() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      fetchAvailableTimes();
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

  const fetchAvailableTimes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/available-times/my/${weekStartStr}`, {
        params: { store_id: selectedStoreId },
      });

      setTimeSlots(response.data.map((item: AvailableTime) => ({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
      })));
    } catch (error) {
      console.error('Failed to fetch available times:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setTimeSlots([...timeSlots, {
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
    }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

  const handleSubmit = async () => {
    if (!selectedStoreId) {
      alert('请先选择门店');
      return;
    }

    if (timeSlots.length === 0) {
      alert('请至少添加一个可用时间段');
      return;
    }

    // 验证时间段
    for (const slot of timeSlots) {
      if (slot.start_time >= slot.end_time) {
        alert('结束时间必须晚于开始时间');
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post('/available-times', {
        week_start_date: weekStartStr,
        store_id: selectedStoreId,
        available_times: timeSlots,
      });

      alert('可用时间提交成功！');
    } catch (error: any) {
      console.error('Submit failed:', error);
      alert(error.response?.data?.error || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearWeek = async () => {
    if (!selectedStoreId) {
      alert('请先选择门店');
      return;
    }

    if (!confirm('确定要清空本周的可用时间吗？')) {
      return;
    }

    try {
      await api.delete(`/available-times/${weekStartStr}`, {
        params: { store_id: selectedStoreId },
      });

      setTimeSlots([]);
      alert('已清空本周可用时间');
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(error.response?.data?.error || '清空失败，请重试');
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

  // 按星期几分组时间段
  const slotsByDay: { [key: number]: TimeSlot[] } = {};
  timeSlots.forEach(slot => {
    if (!slotsByDay[slot.day_of_week]) {
      slotsByDay[slot.day_of_week] = [];
    }
    slotsByDay[slot.day_of_week].push(slot);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <a
                href="#/employee"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回工作台"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">我的可用时间</h1>
              </div>
            </div>
            <StoreSelector
              stores={stores}
              value={selectedStoreId}
              onChange={(storeId) => setSelectedStoreId(storeId)}
            />
          </div>
          <div className="ml-14">
            <div>
              <p className="text-gray-600">提交你每周可以工作的时间段，方便管理员安排排班</p>
            </div>
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

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📝 使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 选择你每天可以工作的时间段，可以添加多个时间段</li>
            <li>• 管理员会根据你提交的可用时间来安排排班</li>
            <li>• 可以随时修改和重新提交</li>
            <li>• 建议提前一周提交下周的可用时间</li>
          </ul>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : (
          <>
            {/* 按星期显示时间段 */}
            <div className="space-y-4 mb-6">
              {DAYS.map((dayName, dayIndex) => {
                const daySlots = slotsByDay[dayIndex] || [];
                const currentDate = addDays(currentWeekStart, dayIndex);

                return (
                  <div key={dayIndex} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{dayName}</h3>
                        <p className="text-sm text-gray-500">
                          {format(currentDate, 'M月d日', { locale: zhCN })}
                        </p>
                      </div>
                      <button
                        onClick={() => addTimeSlot(dayIndex)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        添加时间段
                      </button>
                    </div>

                    {daySlots.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        暂无可用时间段
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {timeSlots.map((slot, index) => {
                          if (slot.day_of_week !== dayIndex) return null;

                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-sm text-gray-500 ml-2">
                                  ({((new Date(`2000-01-01 ${slot.end_time}`) as any) - (new Date(`2000-01-01 ${slot.start_time}`) as any)) / 3600000} 小时)
                                </span>
                              </div>
                              <button
                                onClick={() => removeTimeSlot(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClearWeek}
                disabled={submitting || timeSlots.length === 0}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清空本周
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || timeSlots.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {submitting ? '提交中...' : '保存并提交'}
              </button>
            </div>

            {/* 统计信息 */}
            {timeSlots.length > 0 && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">本周统计</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(slotsByDay).length}
                    </div>
                    <div className="text-sm text-gray-600">可工作天数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {timeSlots.length}
                    </div>
                    <div className="text-sm text-gray-600">时间段数量</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {timeSlots.reduce((sum, slot) => {
                        const start = new Date(`2000-01-01 ${slot.start_time}`);
                        const end = new Date(`2000-01-01 ${slot.end_time}`);
                        return sum + (end.getTime() - start.getTime()) / 3600000;
                      }, 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">总可用小时</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
