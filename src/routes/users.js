import { Router } from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../services/userService.js";

const usersRouter = Router();

// GET /api/users – lấy toàn bộ danh sách
usersRouter.get("/", async (_req, res) => {
  const users = await getAllUsers();
  res.json({ data: users, total: users.length });
});

// GET /api/users/:id – lấy 1 user
usersRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ data: user });
});

// POST /api/users – tạo user mới
usersRouter.post("/", async (req, res) => {
  const { name, email } = req.body ?? {};
  if (!name || !email) {
    return res.status(400).json({ message: "name and email are required" });
  }

  const result = await createUser({ name, email });
  return res.status(201).json({ insertId: result.insertId });
});

// PUT /api/users/:id – cập nhật user
usersRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body ?? {};
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const result = await updateUser(id, { name, email });
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ message: "User updated" });
});

// DELETE /api/users/:id – xóa user
usersRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const result = await deleteUser(id);
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ message: "User deleted" });
});

export default usersRouter;
