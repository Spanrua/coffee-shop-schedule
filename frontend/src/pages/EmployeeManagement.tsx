import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users, Search, Plus, Edit, Trash2, ArrowLeft, UserCheck, UserX } from 'lucide-react';
import type { Store, User } from '../types';

type Employee = Omit<User, 'password_hash'>;

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadEmployees(), loadStores()]);
  };

  const loadStores = async () => {
    const response = await api.get('/stores');
    setStores(response.data);
  };

  useEffect(() => {
    // 搜索过滤
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            emp.name.toLowerCase().includes(term) ||
            emp.username.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      // 只显示员工，不显示管理员
      const employeeList = response.data.filter((u: Employee) => u.role === 'employee' || u.admin_scope === 'store');
      setEmployees(employeeList);
      setFilteredEmployees(employeeList);
    } catch (error) {
      console.error('Failed to load employees:', error);
      alert('加载员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: number, employeeName: string) => {
    if (!confirm(`确定要删除员工 "${employeeName}" 吗？`)) {
      return;
    }

    try {
      await api.delete(`/users/${employeeId}`);
      alert('删除成功');
      loadEmployees();
    } catch (error: any) {
      console.error('Delete employee error:', error);
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${employee.id}`, { status: newStatus });
      alert(`已${newStatus === 'active' ? '激活' : '停用'}员工`);
      loadEmployees();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      alert(error.response?.data?.error || '状态更新失败');
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
              <h1 className="text-xl font-bold text-gray-900">员工管理</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>添加员工</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">员工总数</p>
                <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">在职员工</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {employees.filter((e) => e.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-full p-3">
                <UserX className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">离职员工</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {employees.filter((e) => e.status === 'inactive').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索员工姓名或用户名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 员工列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  主门店
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时薪 (元)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? '没有找到匹配的员工' : '暂无员工'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.primary_store_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{employee.hourly_rate?.toFixed(2) || '50.00'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {employee.status === 'active' ? '在职' : '离职'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.created_at
                        ? new Date(employee.created_at).toLocaleDateString('zh-CN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(employee)}
                        className={`mr-3 ${
                          employee.status === 'active'
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={employee.status === 'active' ? '停用' : '激活'}
                      >
                        {employee.status === 'active' ? (
                          <UserX className="w-4 h-4 inline" />
                        ) : (
                          <UserCheck className="w-4 h-4 inline" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id, employee.name)}
                        className="text-red-600 hover:text-red-900"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加/编辑员工模态框 */}
      {(showAddModal || editingEmployee) && (
        <EmployeeModal
          employee={editingEmployee}
          stores={stores}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
            loadEmployees();
          }}
        />
      )}
    </div>
  );
}

// 员工添加/编辑模态框组件
function EmployeeModal({
  employee,
  stores,
  onClose,
  onSuccess,
}: {
  employee: Employee | null;
  stores: Store[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const defaultStoreId = employee?.primary_store_id || stores[0]?.id || 1;
  const [formData, setFormData] = useState({
    username: employee?.username || '',
    name: employee?.name || '',
    password: '',
    hourly_rate: employee?.hourly_rate?.toString() || '50',
    role: employee?.role || 'employee',
    primary_store_id: defaultStoreId,
    support_store_ids: employee?.support_store_ids || [defaultStoreId],
    managed_store_ids: employee?.managed_store_ids || [],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!employee && !formData.username) {
      alert('请输入用户名');
      return;
    }
    if (!formData.name) {
      alert('请输入姓名');
      return;
    }
    if (!employee && !formData.password) {
      alert('请输入密码');
      return;
    }

    try {
      setSubmitting(true);

      if (employee) {
        // 编辑
        const updateData: any = {
          name: formData.name,
          hourly_rate: parseFloat(formData.hourly_rate),
          role: formData.role,
          admin_scope: formData.role === 'admin' ? 'store' : 'none',
          primary_store_id: formData.primary_store_id,
          support_store_ids: formData.support_store_ids,
          managed_store_ids: formData.role === 'admin' ? formData.managed_store_ids : [],
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${employee.id}`, updateData);
        alert('更新成功');
      } else {
        // 添加
        await api.post('/users', {
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          admin_scope: formData.role === 'admin' ? 'store' : 'none',
          primary_store_id: formData.primary_store_id,
          support_store_ids: formData.support_store_ids,
          managed_store_ids: formData.role === 'admin' ? formData.managed_store_ids : [],
          hourly_rate: parseFloat(formData.hourly_rate),
        });
        alert('添加成功');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {employee ? '编辑员工' : '添加员工'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名 {!employee && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!!employee}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="employee001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="张三"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 {!employee && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={employee ? '留空则不修改' : '至少6位'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value as 'employee' | 'admin';
                setFormData({
                  ...formData,
                  role,
                  managed_store_ids: role === 'admin' ? [formData.primary_store_id] : [],
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">员工</option>
              <option value="admin">门店管理员</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主门店</label>
            <select
              value={formData.primary_store_id}
              onChange={(e) => {
                const storeId = Number(e.target.value);
                setFormData({
                  ...formData,
                  primary_store_id: storeId,
                  support_store_ids: Array.from(new Set([storeId, ...formData.support_store_ids])),
                  managed_store_ids: formData.role === 'admin'
                    ? Array.from(new Set([storeId, ...formData.managed_store_ids]))
                    : formData.managed_store_ids,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">可支援门店</label>
            <div className="grid grid-cols-2 gap-2">
              {stores.map((store) => (
                <label key={store.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.support_store_ids.includes(store.id)}
                    disabled={store.id === formData.primary_store_id}
                    onChange={(e) => {
                      const nextIds = e.target.checked
                        ? Array.from(new Set([...formData.support_store_ids, store.id]))
                        : formData.support_store_ids.filter((id) => id !== store.id);
                      setFormData({ ...formData, support_store_ids: nextIds });
                    }}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  {store.name}
                </label>
              ))}
            </div>
          </div>

          {formData.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">可管理门店</label>
              <div className="grid grid-cols-2 gap-2">
                {stores.map((store) => (
                  <label key={store.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.managed_store_ids.includes(store.id)}
                      disabled={store.id === formData.primary_store_id}
                      onChange={(e) => {
                        const nextIds = e.target.checked
                          ? Array.from(new Set([...formData.managed_store_ids, store.id]))
                          : formData.managed_store_ids.filter((id) => id !== store.id);
                        setFormData({ ...formData, managed_store_ids: nextIds });
                      }}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    {store.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时薪 (元)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              {submitting ? '提交中...' : employee ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
