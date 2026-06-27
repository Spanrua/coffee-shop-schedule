import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, Trash2, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import type { ShiftChangeRequest, Shift } from '../types';

export default function EmployeeRequests() {
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    shift_id: '',
    request_type: 'leave' as 'leave' | 'modify',
    reason: '',
    new_start_time: '',
    new_end_time: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRequests(), fetchMyShifts()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests/my');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const fetchMyShifts = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get('/shifts/my', { params: { start_date: today } });
      const futureShifts = response.data.filter((s: Shift) =>
        s.date >= today && s.status === 'scheduled'
      );
      setMyShifts(futureShifts);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.shift_id || !newRequest.request_type) {
      alert('请填写完整信息');
      return;
    }

    if (newRequest.request_type === 'modify') {
      if (!newRequest.new_start_time || !newRequest.new_end_time) {
        alert('修改班次需要填写新的时间');
        return;
      }
      if (newRequest.new_start_time >= newRequest.new_end_time) {
        alert('结束时间必须晚于开始时间');
        return;
      }
    }

    try {
      await api.post('/requests', {
        shift_id: parseInt(newRequest.shift_id),
        request_type: newRequest.request_type,
        reason: newRequest.reason || null,
        new_start_time: newRequest.new_start_time || null,
        new_end_time: newRequest.new_end_time || null,
      });

      alert('申请已提交，等待管理员审批');
      setShowAddModal(false);
      setNewRequest({
        shift_id: '',
        request_type: 'leave',
        reason: '',
        new_start_time: '',
        new_end_time: '',
      });
      await fetchData();
    } catch (error: any) {
      console.error('Submit request failed:', error);
      alert(error.response?.data?.error || '提交失败，请重试');
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('确定要删除这个申请吗？')) {
      return;
    }

    try {
      await api.delete(`/requests/${id}`);
      await fetchRequests();
    } catch (error: any) {
      console.error('Delete request failed:', error);
      alert(error.response?.data?.error || '删除失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            待审批
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            已批准
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            已拒绝
          </span>
        );
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'leave': return '请假';
      case 'modify': return '修改班次';
      case 'swap': return '调班';
      default: return type;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题和操作 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="#/employee"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回工作台"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">请假/调班申请</h1>
                <p className="text-gray-600">提交请假或调整班次的申请</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              提交申请
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">待审批</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已批准</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已拒绝</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
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
            {/* 申请列表 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  我的申请记录
                </h2>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无申请记录</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {getRequestTypeText(request.request_type)}
                            </span>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                班次时间：{request.date} {request.start_time} - {request.end_time}
                              </span>
                            </div>

                            {request.request_type === 'modify' && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <span>→ 修改为：{request.new_start_time} - {request.new_end_time}</span>
                              </div>
                            )}

                            {request.reason && (
                              <div>
                                <span className="font-medium">申请理由：</span>
                                {request.reason}
                              </div>
                            )}

                            {request.admin_notes && (
                              <div className={`p-3 rounded-lg ${
                                request.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}>
                                <span className="font-medium">管理员备注：</span>
                                {request.admin_notes}
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              提交时间：{format(new Date(request.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </div>
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除申请"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 提交申请模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">提交申请</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请类型
                </label>
                <select
                  value={newRequest.request_type}
                  onChange={(e) => setNewRequest({ ...newRequest, request_type: e.target.value as 'leave' | 'modify' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="leave">请假</option>
                  <option value="modify">修改班次时间</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择班次
                </label>
                <select
                  value={newRequest.shift_id}
                  onChange={(e) => {
                    const shiftId = e.target.value;
                    const shift = myShifts.find(s => s.id === parseInt(shiftId));
                    setNewRequest({
                      ...newRequest,
                      shift_id: shiftId,
                      new_start_time: shift?.start_time || '',
                      new_end_time: shift?.end_time || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">选择要申请的班次</option>
                  {myShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.date} {shift.start_time}-{shift.end_time}
                    </option>
                  ))}
                </select>
                {myShifts.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">暂无可申请的未来班次</p>
                )}
              </div>

              {newRequest.request_type === 'modify' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      新开始时间
                    </label>
                    <input
                      type="time"
                      value={newRequest.new_start_time}
                      onChange={(e) => setNewRequest({ ...newRequest, new_start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      新结束时间
                    </label>
                    <input
                      type="time"
                      value={newRequest.new_end_time}
                      onChange={(e) => setNewRequest({ ...newRequest, new_end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请理由
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  rows={3}
                  placeholder="请简要说明申请理由..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
