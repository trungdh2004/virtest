/**
 * tests/users.api.test.js
 *
 * Integration test (HTTP level) cho routes/users.js.
 * → Mock ở tầng SERVICE (không mock DB trực tiếp).
 *
 * Điều này chứng minh rằng: dù route gọi service nào,
 * ta hoàn toàn kiểm soát được dữ liệu trả về mà không cần DB thật.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/userService.js", () => ({
  getAllUsers: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import app from "../src/app.js";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../src/services/userService.js";

const mockGetAllUsers = vi.mocked(getAllUsers);
const mockGetUserById = vi.mocked(getUserById);
const mockCreateUser = vi.mocked(createUser);
const mockUpdateUser = vi.mocked(updateUser);
const mockDeleteUser = vi.mocked(deleteUser);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/health", () => {
  it('trả về { status: "ok" }', async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/users", () => {
  it("trả về danh sách users", async () => {
    const fakeUsers = [
      { id: 1, name: "An Nguyen", email: "an@example.com" },
      { id: 2, name: "Binh Tran", email: "binh@example.com" },
    ];
    mockGetAllUsers.mockResolvedValueOnce(fakeUsers);

    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: fakeUsers, total: 2 });
    expect(mockGetAllUsers).toHaveBeenCalledOnce();
  });
});

describe("GET /api/users/:id", () => {
  it("trả về 200 và user khi tồn tại", async () => {
    const fakeUser = { id: 1, name: "An Nguyen", email: "an@example.com" };
    mockGetUserById.mockResolvedValueOnce(fakeUser);

    const res = await request(app).get("/api/users/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: fakeUser });
  });

  it("trả về 404 khi user không tồn tại", async () => {
    mockGetUserById.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/users/999");

    expect(res.status).toBe(404);
  });

  it("trả về 400 khi id không hợp lệ", async () => {
    const res = await request(app).get("/api/users/abc");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/users", () => {
  it("tạo user mới và trả về insertId", async () => {
    mockCreateUser.mockResolvedValueOnce({ insertId: 5 });

    const res = await request(app)
      .post("/api/users")
      .send({ name: "Chi Le", email: "chi@example.com" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ insertId: 5 });
    expect(mockCreateUser).toHaveBeenCalledWith({
      name: "Chi Le",
      email: "chi@example.com",
    });
  });

  it("trả về 400 khi thiếu name hoặc email", async () => {
    const res = await request(app).post("/api/users").send({ name: "Chi Le" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/users/:id", () => {
  it("cập nhật user thành công", async () => {
    mockUpdateUser.mockResolvedValueOnce({ affectedRows: 1 });

    const res = await request(app)
      .put("/api/users/1")
      .send({ name: "An Updated", email: "an_new@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "User updated" });
  });

  it("trả về 404 khi user không tồn tại", async () => {
    mockUpdateUser.mockResolvedValueOnce({ affectedRows: 0 });

    const res = await request(app)
      .put("/api/users/999")
      .send({ name: "X", email: "x@x.com" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/users/:id", () => {
  it("xóa user thành công", async () => {
    mockDeleteUser.mockResolvedValueOnce({ affectedRows: 1 });

    const res = await request(app).delete("/api/users/2");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "User deleted" });
  });

  it("trả về 404 khi user không tồn tại", async () => {
    mockDeleteUser.mockResolvedValueOnce({ affectedRows: 0 });

    const res = await request(app).delete("/api/users/999");

    expect(res.status).toBe(404);
  });
});
