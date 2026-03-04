/**
 * orderService.js
 *
 * Minh họa 1 hàm chạy NHIỀU query liên tiếp (không dùng transaction để đơn giản).
 * Mục tiêu: cho bạn thấy cách mock từng lần gọi pool.query.
 */
import pool from "../db/connection.js";

/**
 * Tạo đơn hàng – chạy 3 query theo thứ tự:
 *   1. INSERT vào bảng orders           → lấy orderId
 *   2. INSERT vào bảng order_items      → lưu sản phẩm trong đơn
 *   3. UPDATE products giảm stock       → trừ số lượng tồn kho
 *
 * @param {{ userId: number, productId: number, quantity: number, price: number }} data
 * @returns {Promise<{ orderId: number }>}
 */
export async function createOrder({ userId, productId, quantity, price }) {
  // ── Query 1: tạo đơn hàng ────────────────────────────────────
  const [orderResult] = await pool.query(
    "INSERT INTO orders (user_id, total) VALUES (?, ?)",
    [userId, quantity * price],
  );
  const orderId = orderResult.insertId;

  // ── Query 2: tạo chi tiết đơn hàng ───────────────────────────
  await pool.query(
    "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
    [orderId, productId, quantity, price],
  );

  // ── Query 3: cập nhật tồn kho sản phẩm ───────────────────────
  const [stockResult] = await pool.query(
    "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
    [quantity, productId, quantity],
  );

  // Nếu không có hàng nào bị ảnh hưởng → hết hàng
  if (stockResult.affectedRows === 0) {
    throw new Error("Not enough stock");
  }

  return { orderId };
}

/**
 * Lấy đơn hàng cùng toàn bộ sản phẩm trong đó – chạy 2 query:
 *   1. SELECT đơn hàng
 *   2. SELECT danh sách sản phẩm theo orderId
 *
 * @param {number} orderId
 * @returns {Promise<{ order: object, items: object[] } | null>}
 */
export async function getOrderWithItems(orderId) {
  // ── Query 1: lấy thông tin đơn hàng ──────────────────────────
  const [orderRows] = await pool.query("SELECT * FROM orders WHERE id = ?", [
    orderId,
  ]);

  if (!orderRows[0]) return null;

  // ── Query 2: lấy danh sách sản phẩm trong đơn ────────────────
  const [itemRows] = await pool.query(
    "SELECT * FROM order_items WHERE order_id = ?",
    [orderId],
  );

  return { order: orderRows[0], items: itemRows };
}
