/**
 * tests/userService.test.js
 *
 * Unit test cho các hàm trong userService.js.
 *
 * CỐT LÕI CẦN HỌC:
 * ─────────────────────────────────────────────────────────────
 * 1. vi.mock('path')           → thay toàn bộ module bằng mock
 * 2. vi.mocked(fn)             → giúp TypeScript / autocomplete
 * 3. mockResolvedValueOnce()   → giả lập 1 lần gọi async resolve
 * 4. mockRejectedValueOnce()   → giả lập 1 lần gọi async reject (lỗi)
 * 5. expect(fn).toHaveBeenCalledWith() → kiểm tra args đã truyền vào
 * ─────────────────────────────────────────────────────────────
 *
 * Không có MySQL thật nào được kết nối trong quá trình test.
 * "pool.query" là hàm giả (vi.fn) trả về data mình định nghĩa.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ① Khai báo mock TRƯỚC khi import service
//   Vitest sẽ hoisting vi.mock() lên đầu file tự động.
vi.mock("../src/db/connection.js", () => {
  return {
    // pool là default export → ta giả lập nó là object có hàm query
    default: {
      query: vi.fn(),
    },
  };
});

// ② Import pool (đây là bản mock, không phải MySQL thật)
import pool from "../src/db/connection.js";

// ③ Import các hàm service cần test
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../src/services/userService.js";

// Lấy tham chiếu hàm query đã được mock để dễ gọi mockResolvedValueOnce
const mockQuery = vi.mocked(pool.query);

// Reset trạng thái mock sau mỗi test để các test không ảnh hưởng nhau
beforeEach(() => {
  mockQuery.mockReset();
});

// ─────────────────────────────────────────────
// getAllUsers
// ─────────────────────────────────────────────
describe("getAllUsers()", () => {
  it("trả về danh sách users từ DB", async () => {
    const fakeRows = [
      { id: 1, name: "An Nguyen", email: "an@example.com" },
      { id: 2, name: "Binh Tran", email: "binh@example.com" },
    ];
    mockQuery.mockResolvedValueOnce([fakeRows]);

    const result = await getAllUsers();

    expect(result).toEqual(fakeRows);
    expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users");
  });

  it("trả về mảng rỗng khi DB không có dữ liệu", async () => {
    mockQuery.mockResolvedValueOnce([[]]);

    const result = await getAllUsers();

    expect(result).toEqual([]);
  });

  it("ném lỗi khi DB lỗi (mockRejectedValueOnce)", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB connection failed"));

    await expect(getAllUsers()).rejects.toThrow("DB connection failed");
  });

  // ✨ TEST CASE ĐẶC BIỆT: Trả về rất nhiều user (large dataset)
  it("[EDGE CASE] vẫn hoạt động đúng khi DB trả về 10,000 users", async () => {
    const largeDataset = Array.from({ length: 10_000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    mockQuery.mockResolvedValueOnce([largeDataset]);

    const result = await getAllUsers();

    // Đảm bảo không bị mất dữ liệu và đúng số lượng
    expect(result).toHaveLength(10_000);
    expect(result[0]).toEqual({ id: 1, name: "User 1", email: "user1@example.com" });
    expect(result[9_999]).toEqual({ id: 10_000, name: "User 10000", email: "user10000@example.com" });
  });
});

// ─────────────────────────────────────────────
// getUserById
// ─────────────────────────────────────────────
describe("getUserById()", () => {
  it("trả về user khi tìm thấy id", async () => {
    const fakeUser = { id: 1, name: "An Nguyen", email: "an@example.com" };
    mockQuery.mockResolvedValueOnce([[fakeUser]]);

    const result = await getUserById(1);

    expect(result).toEqual(fakeUser);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE id = ?",
      [1],
    );
  });

  it("trả về null khi không tìm thấy id", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // rows rỗng

    const result = await getUserById(999);

    expect(result).toBeNull();
  });

  // ✨ TEST CASE ĐẶC BIỆT: Gọi getUserById nhiều lần liên tiếp với các id khác nhau
  it("[EDGE CASE] nhiều lần gọi liên tiếp trả về đúng user tương ứng với từng id", async () => {
    const userA = { id: 1, name: "An Nguyen", email: "an@example.com" };
    const userB = { id: 2, name: "Binh Tran", email: "binh@example.com" };
    const userC = { id: 3, name: "Chi Le", email: "chi@example.com" };

    // Chain 3 kết quả theo đúng thứ tự gọi
    mockQuery
      .mockResolvedValueOnce([[userA]])
      .mockResolvedValueOnce([[userB]])
      .mockResolvedValueOnce([[userC]]);

    const [r1, r2, r3] = await Promise.all([
      getUserById(1),
      getUserById(2),
      getUserById(3),
    ]);

    expect(r1).toEqual(userA);
    expect(r2).toEqual(userB);
    expect(r3).toEqual(userC);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });
});

// ─────────────────────────────────────────────
// createUser
// ─────────────────────────────────────────────
describe("createUser()", () => {
  it("trả về insertId sau khi tạo thành công", async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 42 }]);

    const result = await createUser({
      name: "Chi Le",
      email: "chi@example.com",
    });

    expect(result).toEqual({ insertId: 42 });
    expect(mockQuery).toHaveBeenCalledWith(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      ["Chi Le", "chi@example.com"],
    );
  });

  it("ném lỗi khi email bị trùng (duplicate entry)", async () => {
    const dbError = new Error(
      "Duplicate entry 'chi@example.com' for key 'email'",
    );
    mockQuery.mockRejectedValueOnce(dbError);

    await expect(
      createUser({ name: "Chi Le", email: "chi@example.com" }),
    ).rejects.toThrow("Duplicate entry");
  });

  // ✨ TEST CASE ĐẶC BIỆT: Tạo user với tên và email có ký tự đặc biệt
  it("[EDGE CASE] tạo user với tên chứa ký tự Unicode và email dài bất thường", async () => {
    const specialName = "Nguyễn Văn Ánh 🌟";
    const longEmail = `${ "a".repeat(64) }@${ "b".repeat(63) }.com`; // gần giới hạn RFC 5321

    mockQuery.mockResolvedValueOnce([{ insertId: 99 }]);

    const result = await createUser({ name: specialName, email: longEmail });

    expect(result).toEqual({ insertId: 99 });
    expect(mockQuery).toHaveBeenCalledWith(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [specialName, longEmail],
    );
  });
});

// ─────────────────────────────────────────────
// updateUser
// ─────────────────────────────────────────────
describe("updateUser()", () => {
  it("trả về affectedRows = 1 khi cập nhật thành công", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await updateUser(1, {
      name: "An Updated",
      email: "an_new@example.com",
    });

    expect(result).toEqual({ affectedRows: 1 });
    expect(mockQuery).toHaveBeenCalledWith(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      ["An Updated", "an_new@example.com", 1],
    );
  });

  it("trả về affectedRows = 0 khi id không tồn tại", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const result = await updateUser(999, { name: "X", email: "x@x.com" });

    expect(result).toEqual({ affectedRows: 0 });
  });

  // ✨ TEST CASE ĐẶC BIỆT: DB timeout khi update
  it("[EDGE CASE] ném lỗi timeout khi DB không phản hồi trong lúc update", async () => {
    mockQuery.mockRejectedValueOnce(new Error("ER_LOCK_WAIT_TIMEOUT: Lock wait timeout exceeded"));

    await expect(
      updateUser(1, { name: "Timeout", email: "timeout@test.com" })
    ).rejects.toThrow("ER_LOCK_WAIT_TIMEOUT");
  });
});

// ─────────────────────────────────────────────
// deleteUser
// ─────────────────────────────────────────────
describe("deleteUser()", () => {
  it("trả về affectedRows = 1 khi xóa thành công", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await deleteUser(2);

    expect(result).toEqual({ affectedRows: 1 });
    expect(mockQuery).toHaveBeenCalledWith(
      "DELETE FROM users WHERE id = ?",
      [2],
    );
  });

  it("trả về affectedRows = 0 khi id không tồn tại", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const result = await deleteUser(999);

    expect(result).toEqual({ affectedRows: 0 });
  });

  // ✨ TEST CASE ĐẶC BIỆT: Xóa user có foreign key constraint
  it("[EDGE CASE] ném lỗi foreign key constraint khi user đang liên kết với bảng khác", async () => {
    const fkError = new Error(
      "ER_ROW_IS_REFERENCED_2: Cannot delete or update a parent row: a foreign key constraint fails"
    );
    mockQuery.mockRejectedValueOnce(fkError);

    await expect(deleteUser(1)).rejects.toThrow("ER_ROW_IS_REFERENCED_2");

    // Xác nhận query vẫn được gọi đúng
    expect(mockQuery).toHaveBeenCalledWith(
      "DELETE FROM users WHERE id = ?",
      [1],
    );
  });
});
