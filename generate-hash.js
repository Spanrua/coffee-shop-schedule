const bcrypt = require('bcrypt');

// 生成 admin123 的哈希
bcrypt.hash('admin123', 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('admin123 hash:', hash);

  // 生成 password123 的哈希
  bcrypt.hash('password123', 10, (err2, hash2) => {
    if (err2) {
      console.error('Error:', err2);
      return;
    }
    console.log('password123 hash:', hash2);
  });
});
