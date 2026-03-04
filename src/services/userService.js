/**
 * userService.js – các hàm truy vấn MySQL cho bảng users
 *
 * Mỗi hàm nhận pool (hoặc dùng pool mặc định), thực hiện 1 truy vấn
 * và trả về kết quả. Tách riêng khỏi route để dễ test / mock.
 */
import pool from "../db/connection.js";

/**
 * Lấy toàn bộ danh sách users.
 * @returns {Promise<User[]>}
 */
export async function getAllUsers() {
  const [rows] = await pool.query("SELECT * FROM users");
  return rows;
}

/**
 * Lấy 1 user theo id.
 * Dùng prepared statement (?) để tránh SQL injection.
 * @param {number} id
 * @returns {Promise<User|null>}
 */
export async function getUserById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] ?? null;
}

/**
 * Tạo user mới.
 * @param {{ name: string, email: string }} data
 * @returns {Promise<{ insertId: number }>}
 */
export async function createUser({ name, email }) {
  const [result] = await pool.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email],
  );
  return { insertId: result.insertId };
}

/**
 * Cập nhật thông tin user.
 * @param {number} id
 * @param {{ name?: string, email?: string }} data
 * @returns {Promise<{ affectedRows: number }>}
 */
export async function updateUser(id, { name, email }) {
  const [result] = await pool.query(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    [name, email, id],
  );
  return { affectedRows: result.affectedRows };
}

/**
 * Xóa user theo id.
 * @param {number} id
 * @returns {Promise<{ affectedRows: number }>}
 */
export async function deleteUser(id) {
  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return { affectedRows: result.affectedRows };
}
