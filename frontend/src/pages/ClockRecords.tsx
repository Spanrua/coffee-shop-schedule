import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Filter, Calendar, User, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface ClockRecord {
  id: number;
  user_id: number;
  user_name: string;
  username: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  shift_id: number | null;
  shift_start: string | null;
  shift_end: string | null;
  is_anomaly: boolean;
  admin_approved: boolean;
  notes: string | null;
}

export default function ClockRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ClockRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ClockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<ClockRecord | null>(null);

  useEffect(() => {
    loadEmployees();
    loadRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, startDate, endDate, selectedUserId]);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data.filter((u: any) => u.role === 'employee'));
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clock/records');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to load records:', error);
      alert('加载打卡记录失败');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (startDate) {
      filtered = filtered.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((r) => r.date <= endDate);
    }
    if (selectedUserId) {
      filtered = filtered.filter((r) => r.user_id === parseInt(selectedUserId));
    }

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return format(new Date(isoString), 'HH:mm:ss');
    } catch {
      return '-';
    }
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return '-';
    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return hours.toFixed(2) + ' 小时';
    } catch {
      return '-';
    }
  };

  const handleApprove = async (recordId: number) => {
    try {
      await api.put(`/clock/records/${recordId}`, {
        admin_approved: true,
        is_anomaly: false,
      });
      alert('已批准');
      loadRecords();
    } catch (error: any) {
      console.error('Approve error:', error);
      alert(error.response?.data?.error || '批准失败');
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
              <h1 className="text-xl font-bold text-gray-900">打卡记录</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选区域 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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

            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                员工
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部员工</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                清除筛选
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            共 <span className="font-semibold text-gray-900">{filteredRecords.length}</span> 条记录
          </div>
        </div>

        {/* 打卡记录列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    员工
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上班打卡
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    下班打卡
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工作时长
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排班时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      没有找到打卡记录
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.user_name}</div>
                        <div className="text-xs text-gray-500">{record.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(record.clock_in_time)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(record.clock_out_time)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateHours(record.clock_in_time, record.clock_out_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.shift_start && record.shift_end
                          ? `${record.shift_start} - ${record.shift_end}`
                          : '无排班'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {record.is_anomaly && !record.admin_approved && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              异常
                            </span>
                          )}
                          {record.admin_approved && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              已批准
                            </span>
                          )}
                          {!record.clock_out_time && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              在岗
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingRecord(record)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        {record.is_anomaly && !record.admin_approved && (
                          <button
                            onClick={() => handleApprove(record.id)}
                            className="text-green-600 hover:text-green-900"
                            title="批准"
                          >
                            <CheckCircle className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 编辑打卡记录模态框 */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => {
            setEditingRecord(null);
            loadRecords();
          }}
        />
      )}
    </div>
  );
}

// 编辑打卡记录模态框
function EditRecordModal({
  record,
  onClose,
  onSuccess,
}: {
  record: ClockRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    clock_in_time: record.clock_in_time
      ? format(new Date(record.clock_in_time), "yyyy-MM-dd'T'HH:mm")
      : '',
    clock_out_time: record.clock_out_time
      ? format(new Date(record.clock_out_time), "yyyy-MM-dd'T'HH:mm")
      : '',
    notes: record.notes || '',
    admin_approved: record.admin_approved,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clock_in_time) {
      alert('请输入上班打卡时间');
      return;
    }

    try {
      setSubmitting(true);

      await api.put(`/clock/records/${record.id}`, {
        clock_in_time: formData.clock_in_time ? new Date(formData.clock_in_time).toISOString() : null,
        clock_out_time: formData.clock_out_time ? new Date(formData.clock_out_time).toISOString() : null,
        notes: formData.notes || null,
        admin_approved: formData.admin_approved,
        is_anomaly: false, // 管理员修改后清除异常标记
      });

      alert('更新成功');
      onSuccess();
    } catch (error: any) {
      console.error('Update error:', error);
      alert(error.response?.data?.error || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">编辑打卡记录</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            员工: <span className="font-medium text-gray-900">{record.user_name}</span>
          </div>
          <div className="text-sm text-gray-600">
            日期: <span className="font-medium text-gray-900">{record.date}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              上班打卡时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.clock_in_time}
              onChange={(e) => setFormData({ ...formData, clock_in_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">下班打卡时间</label>
            <input
              type="datetime-local"
              value={formData.clock_out_time}
              onChange={(e) => setFormData({ ...formData, clock_out_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="补录原因、调整说明等"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="admin_approved"
              checked={formData.admin_approved}
              onChange={(e) => setFormData({ ...formData, admin_approved: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="admin_approved" className="ml-2 text-sm text-gray-700">
              管理员已批准
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
