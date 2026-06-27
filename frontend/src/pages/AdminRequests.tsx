import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FileText, CheckCircle, XCircle, AlertCircle, Clock, User, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import type { ShiftChangeRequest } from '../types';

export default function AdminRequests() {
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ShiftChangeRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/requests/all', {
        params: filter === 'all' ? {} : { status: filter },
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedRequest) return;

    try {
      const endpoint = approvalAction === 'approve' ? 'approve' : 'reject';
      await api.post(`/requests/${selectedRequest.id}/${endpoint}`, {
        admin_notes: adminNotes || null,
      });

      alert(approvalAction === 'approve' ? '申请已批准' : '申请已拒绝');
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      await fetchRequests();
    } catch (error: any) {
      console.error('Approval failed:', error);
      alert(error.response?.data?.error || '操作失败，请重试');
    }
  };

  const openApprovalModal = (request: ShiftChangeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setAdminNotes('');
    setShowApprovalModal(true);
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
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <a
              href="#/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回控制台"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">请假/调班审批</h1>
            </div>
          </div>
          <p className="text-gray-600 ml-14">审批员工的请假和调班申请</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">全部申请</p>
                <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

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

        {/* 筛选标签 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              待审批 ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              已批准 ({approvedCount})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              已拒绝 ({rejectedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
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
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-lg font-semibold text-gray-900">
                              {getRequestTypeText(request.request_type)}
                            </span>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>
                                <span className="font-medium">{request.requester_name}</span>
                                {' '}(@{request.requester_username})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                {request.date} {request.start_time} - {request.end_time}
                              </span>
                            </div>
                          </div>

                          {request.request_type === 'modify' && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg text-sm">
                              <span className="font-medium text-blue-900">修改为：</span>
                              <span className="text-blue-700">
                                {request.new_start_time} - {request.new_end_time}
                              </span>
                            </div>
                          )}

                          {request.reason && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
                              <span className="font-medium text-gray-900">申请理由：</span>
                              <span className="text-gray-700">{request.reason}</span>
                            </div>
                          )}

                          {request.admin_notes && (
                            <div className={`mb-3 p-3 rounded-lg text-sm ${
                              request.status === 'approved'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                              <span className="font-medium">管理员备注：</span>
                              {request.admin_notes}
                              {request.admin_name && (
                                <span className="ml-2 text-xs">
                                  - {request.admin_name}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            提交时间：{format(new Date(request.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() => openApprovalModal(request, 'approve')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              批准
                            </button>
                            <button
                              onClick={() => openApprovalModal(request, 'reject')}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              拒绝
                            </button>
                          </div>
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

      {/* 审批模态框 */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {approvalAction === 'approve' ? '批准申请' : '拒绝申请'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">申请人：</span>
                  {selectedRequest.requester_name}
                </div>
                <div>
                  <span className="font-medium">类型：</span>
                  {getRequestTypeText(selectedRequest.request_type)}
                </div>
                <div>
                  <span className="font-medium">班次：</span>
                  {selectedRequest.date} {selectedRequest.start_time}-{selectedRequest.end_time}
                </div>
                {selectedRequest.reason && (
                  <div>
                    <span className="font-medium">理由：</span>
                    {selectedRequest.reason}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注说明{approvalAction === 'reject' && '（必填）'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder={approvalAction === 'approve' ? '可选填写批准说明...' : '请说明拒绝理由...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleApproval}
                disabled={approvalAction === 'reject' && !adminNotes.trim()}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                确认{approvalAction === 'approve' ? '批准' : '拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
