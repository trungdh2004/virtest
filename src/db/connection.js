/**
 * Kết nối MySQL bằng mysql2/promise (pool – dùng lại connection hiệu quả)
 *
 * Cấu hình đọc từ biến môi trường → không hardcode mật khẩu vào source.
 * Tạo file .env ở gốc dự án:
 *   DB_HOST=localhost
 *   DB_PORT=3306
 *   DB_USER=root
 *   DB_PASSWORD=secret
 *   DB_NAME=vite_test
 */
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "vite_test",
  waitForConnections: true,
  connectionLimit: 10, // tối đa 10 connection đồng thời
  queueLimit: 0, // 0 = không giới hạn hàng đợi
});

export default pool;
