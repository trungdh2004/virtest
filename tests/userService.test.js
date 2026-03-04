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
    mockQuery.mockResolvedValueOnce([[]]);

    const result = await getUserById(999);

    expect(result).toBeNull();
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
});
