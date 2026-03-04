# vite_test

Dự án học **Vitest** với Express + MySQL2, bao gồm unit test và integration test.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express v5
- **Database**: MySQL2 (connection pool)
- **Testing**: Vitest (multi-project: frontend + backend)
- **Test Tools**: Supertest (HTTP integration tests), vi.mock (mocking)

## Cấu trúc dự án

```
├── src/
│   ├── app.js              # Express app (routes setup)
│   ├── server.js           # HTTP server entrypoint
│   ├── data/
│   │   └── mockUsers.js    # Dữ liệu mẫu
│   ├── db/
│   │   └── connection.js   # MySQL2 connection pool
│   ├── routes/
│   │   └── users.js        # CRUD routes cho /api/users
│   └── services/
│       ├── userService.js  # Business logic cho users
│       └── orderService.js # Business logic cho orders
├── tests/
│   ├── userService.test.js # Unit tests cho userService
│   ├── orderService.test.js# Unit tests cho orderService
│   └── users.api.test.js   # Integration tests cho users API
└── vitest.config.js        # Vitest multi-project config
```

## Scripts

```bash
# Chạy API server (dev mode với hot-reload)
npm run api:dev

# Chạy tất cả tests
npm test

# Chạy chỉ backend tests
npm run test:api

# Chạy tests với UI
npm run test-ui
```

## Cài đặt

```bash
npm install
```

Tạo file `.env` ở gốc dự án:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=vite_test
```

## API Endpoints

| Method | Endpoint         | Mô tả              |
|--------|-----------------|--------------------|
| GET    | /api/health     | Health check       |
| GET    | /api/users      | Lấy tất cả users   |
| GET    | /api/users/:id  | Lấy 1 user theo id |
| POST   | /api/users      | Tạo user mới       |
| PUT    | /api/users/:id  | Cập nhật user      |
| DELETE | /api/users/:id  | Xóa user           |
