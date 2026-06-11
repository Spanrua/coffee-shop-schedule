-- 种子数据：初始用户和配置

-- 插入管理员账户 (密码: admin123)
INSERT INTO users (username, password_hash, name, role, hourly_rate) VALUES
('admin', '$2b$10$B/MQymwrOpitvLh5PPtsf.TL/mLnrkIY24fBjYO/nP66LT79oHQVi', '管理员', 'admin', 50.0);

-- 插入测试员工账户 (密码都是: password123)
INSERT INTO users (username, password_hash, name, role, hourly_rate) VALUES
('emp001', '$2b$10$RBoDNwzlNqQkF2nsqz.LJuDhMtddS2kKnvzt/majpUvbwCUMTF6dK', '张三', 'employee', 50.0),
('emp002', '$2b$10$RBoDNwzlNqQkF2nsqz.LJuDhMtddS2kKnvzt/majpUvbwCUMTF6dK', '李四', 'employee', 50.0),
('emp003', '$2b$10$RBoDNwzlNqQkF2nsqz.LJuDhMtddS2kKnvzt/majpUvbwCUMTF6dK', '王五', 'employee', 50.0),
('emp004', '$2b$10$RBoDNwzlNqQkF2nsqz.LJuDhMtddS2kKnvzt/majpUvbwCUMTF6dK', '赵六', 'employee', 55.0),
('emp005', '$2b$10$RBoDNwzlNqQkF2nsqz.LJuDhMtddS2kKnvzt/majpUvbwCUMTF6dK', '孙七', 'employee', 55.0);

-- 插入默认班次需求配置（周一到周日，每天三个班次）
-- 早班 8:00-12:00，至少2人
INSERT INTO shift_requirements (day_of_week, time_slot_start, time_slot_end, min_employees) VALUES
(0, '08:00', '12:00', 2), -- 周日
(1, '08:00', '12:00', 2), -- 周一
(2, '08:00', '12:00', 2), -- 周二
(3, '08:00', '12:00', 2), -- 周三
(4, '08:00', '12:00', 2), -- 周四
(5, '08:00', '12:00', 2), -- 周五
(6, '08:00', '12:00', 2); -- 周六

-- 午班 12:00-16:00，至少2人
INSERT INTO shift_requirements (day_of_week, time_slot_start, time_slot_end, min_employees) VALUES
(0, '12:00', '16:00', 2),
(1, '12:00', '16:00', 2),
(2, '12:00', '16:00', 2),
(3, '12:00', '16:00', 2),
(4, '12:00', '16:00', 2),
(5, '12:00', '16:00', 2),
(6, '12:00', '16:00', 2);

-- 晚班 16:00-20:00，至少2人
INSERT INTO shift_requirements (day_of_week, time_slot_start, time_slot_end, min_employees) VALUES
(0, '16:00', '20:00', 2),
(1, '16:00', '20:00', 2),
(2, '16:00', '20:00', 2),
(3, '16:00', '20:00', 2),
(4, '16:00', '20:00', 2),
(5, '16:00', '20:00', 2),
(6, '16:00', '20:00', 2);

-- 插入系统配置
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('overtime_daily_threshold', '8', '每日加班工时阈值（小时）'),
('overtime_daily_multiplier', '1.5', '每日加班工资倍数'),
('overtime_weekly_threshold', '40', '每周加班工时阈值（小时）'),
('overtime_weekly_multiplier', '2.0', '每周加班工资倍数'),
('weekend_multiplier', '1.5', '周末工资倍数'),
('clock_anomaly_threshold', '120', '打卡异常判定阈值（分钟）'),
('business_hours_start', '08:00', '营业开始时间'),
('business_hours_end', '20:00', '营业结束时间');
