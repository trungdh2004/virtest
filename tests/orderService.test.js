/**
 * tests/orderService.test.js
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  HỌC: MOCK NHIỀU QUERY TRONG 1 HÀM                             │
 * │                                                                 │
 * │  Mỗi lần hàm gọi pool.query(...) sẽ tiêu thụ 1 giá trị        │
 * │  mockResolvedValueOnce theo đúng THỨ TỰ bạn chain.             │
 * │                                                                 │
 * │  mockQuery                                                      │
 * │    .mockResolvedValueOnce(...)   ← lần gọi thứ 1               │
 * │    .mockResolvedValueOnce(...)   ← lần gọi thứ 2               │
 * │    .mockResolvedValueOnce(...)   ← lần gọi thứ 3               │
 * └─────────────────────────────────────────────────────────────────┘
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db/connection.js", () => ({
  default: { query: vi.fn() },
}));

import pool from "../src/db/connection.js";
import {
  createOrder,
  getOrderWithItems,
} from "../src/services/orderService.js";

const mockQuery = vi.mocked(pool.query);

beforeEach(() => {
  mockQuery.mockReset();
});

// ─────────────────────────────────────────────────────────────────
// createOrder – 3 query liên tiếp
// ─────────────────────────────────────────────────────────────────
describe("createOrder()", () => {
  it("chạy đúng 3 query theo thứ tự và trả về orderId", async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 7 }])
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await createOrder({
      userId: 1,
      productId: 5,
      quantity: 2,
      price: 50000,
    });

    expect(result).toEqual({ orderId: 7 });
    expect(mockQuery).toHaveBeenCalledTimes(3);

    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [1, 100000],
    );
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      [7, 5, 2, 50000],
    );
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
      [2, 5, 2],
    );
  });

  it('ném lỗi "Not enough stock" khi query 3 trả về affectedRows = 0', async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 8 }])
      .mockResolvedValueOnce([{ insertId: 21 }])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    await expect(
      createOrder({ userId: 1, productId: 5, quantity: 100, price: 50000 }),
    ).rejects.toThrow("Not enough stock");

    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it("dừng ở query 2 nếu query 1 lỗi (DB lỗi giữa chừng)", async () => {
    mockQuery
      .mockRejectedValueOnce(new Error("DB write error"))
      .mockResolvedValueOnce([{ insertId: 22 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(
      createOrder({ userId: 1, productId: 5, quantity: 1, price: 50000 }),
    ).rejects.toThrow("DB write error");

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// getOrderWithItems – 2 query phụ thuộc nhau
// ─────────────────────────────────────────────────────────────────
describe("getOrderWithItems()", () => {
  it("trả về order và items khi tìm thấy", async () => {
    const fakeOrder = { id: 7, user_id: 1, total: 100000 };
    const fakeItems = [
      { id: 20, order_id: 7, product_id: 5, quantity: 2, price: 50000 },
    ];

    mockQuery
      .mockResolvedValueOnce([[fakeOrder]])
      .mockResolvedValueOnce([fakeItems]);

    const result = await getOrderWithItems(7);

    expect(result).toEqual({ order: fakeOrder, items: fakeItems });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      "SELECT * FROM order_items WHERE order_id = ?",
      [7],
    );
  });

  it("trả về null và KHÔNG gọi query 2 khi đơn hàng không tồn tại", async () => {
    mockQuery.mockResolvedValueOnce([[]]);

    const result = await getOrderWithItems(999);

    expect(result).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
