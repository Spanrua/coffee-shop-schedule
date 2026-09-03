export interface User {
  id: number;
  username: string;
  name: string;
  role: 'employee' | 'admin';
  admin_scope?: 'none' | 'store' | 'super';
  primary_store_id?: number;
  primary_store_name?: string;
  support_store_ids?: number[];
  managed_store_ids?: number[];
  hourly_rate?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Store {
  id: number;
  name: string;
  status: 'active' | 'inactive';
}

export interface AvailableTime {
  id?: number;
  user_id?: number;
  store_id?: number;
  store_name?: string;
  week_start_date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Shift {
  id: number;
  user_id: number;
  store_id?: number;
  store_name?: string;
  user_name?: string;
  username?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  notes?: string;
}

export interface ClockRecord {
  id: number;
  shift_id?: number;
  user_id: number;
  store_id?: number;
  store_name?: string;
  user_name?: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  is_anomaly: boolean;
  admin_approved: boolean;
  notes?: string;
  shift_start?: string;
  shift_end?: string;
}

export interface ShiftRequirement {
  id?: number;
  store_id?: number;
  day_of_week: number;
  time_slot_start: string;
  time_slot_end: string;
  min_employees: number;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export interface PayrollRecord {
  user_id: number;
  name: string;
  username: string;
  total_hours: number;
  hourly_rate?: number;
  total_pay?: number;
  daily_records: DailyRecord[];
}

export interface DailyRecord {
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  actual_hours: number;
  is_weekend: boolean;
  is_missing_clock: boolean;
  daily_pay?: number;
}

export interface ShiftChangeRequest {
  id: number;
  requester_id: number;
  shift_id: number;
  request_type: 'swap' | 'leave' | 'modify';
  reason?: string;
  new_start_time?: string;
  new_end_time?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_id?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  // 关联信息
  date?: string;
  start_time?: string;
  end_time?: string;
  requester_name?: string;
  requester_username?: string;
  admin_name?: string;
  store_id?: number;
  store_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'schedule' | 'request' | 'approval' | 'reminder' | 'system';
  is_read: boolean;
  related_id?: number;
  related_type?: string;
  created_at: string;
}
