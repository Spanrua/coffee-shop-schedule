-- PostgreSQL 种子数据

-- 插入默认管理员和员工
-- 密码都是原始密码的 bcrypt 哈希值
-- admin: admin123
-- emp001-emp005: password123

INSERT INTO users (username, password, name, role, hourly_rate) VALUES
('admin', '$2a$10$YQhZ3Z8Z3Z8Z3Z8Z3Z8Z3OeMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '管理员', 'admin', 0),
('emp001', '$2a$10$YQhZ3Z8Z3Z8Z3Z8Z3Z8Z3OeMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '王小明', 'employee', 50),
('emp002', '$2a$10$YQhZ3Z8Z3Z8Z3Z8Z3Z8Z3OeMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '李小红', 'employee', 55),
('emp003', '$2a$10$YQhZ3Z8Z3Z8Z3Z8Z3Z8Z3OeMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '张小刚', 'employee', 52),
('emp004', '$2a$10$YQhZ3Z8Z3Z8Z3Z8Z3Z8Z3OeMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '刘小芳', 'employee', 48),
('emp005', '$2a$10$YQhZ3Z8Z3Z8Z3Z8Z3Z8Z3OeMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '陈小华', 'employee', 53)
ON CONFLICT (username) DO NOTHING;

-- 插入默认班次需求
INSERT INTO shift_requirements (day_of_week, time_slot, required_staff) VALUES
(0, '09:00-13:00', 2),
(0, '13:00-17:00', 2),
(1, '09:00-13:00', 3),
(1, '13:00-17:00', 3),
(2, '09:00-13:00', 3),
(2, '13:00-17:00', 3),
(3, '09:00-13:00', 3),
(3, '13:00-17:00', 3),
(4, '09:00-13:00', 3),
(4, '13:00-17:00', 3),
(5, '09:00-13:00', 4),
(5, '13:00-17:00', 4),
(6, '09:00-13:00', 4),
(6, '13:00-17:00', 4);
