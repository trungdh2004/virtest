import express from "express";
import usersRouter from "./routes/users.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", usersRouter);

export default app;
