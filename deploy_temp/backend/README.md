# MyCheckServer Backend

Backend API untuk MyCheckServer - Platform Monitoring Server

## Prerequisites

- Node.js 18+
- npm atau yarn

## Installation

```bash
cd backend
npm install
```

## Configuration

Edit file `.env` untuk konfigurasi:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Midtrans Configuration (Sandbox)
MIDTRANS_MERCHANT_ID=G286074213
MIDTRANS_CLIENT_KEY=Mid-client-srWp3w2kAkWSdSUU
MIDTRANS_SERVER_KEY=Mid-server-OfqX2njKcm2uaNxPXsY58Ni4
MIDTRANS_IS_PRODUCTION=false

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Register user baru
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get profile (protected)
- PUT `/api/auth/profile` - Update profile (protected)
- PUT `/api/auth/password` - Update password (protected)
- DELETE `/api/auth/account` - Delete account (protected)

### Servers
- GET `/api/servers` - List all servers (protected)
- GET `/api/servers/:id` - Get server detail (protected)
- POST `/api/servers` - Add new server (protected)
- PUT `/api/servers/:id` - Update server (protected)
- DELETE `/api/servers/:id` - Delete server (protected)
- POST `/api/servers/:id/check` - Check server now (protected)

### Billing
- GET `/api/billing/plan` - Get current plan (protected)
- POST `/api/billing/create-payment` - Create Midtrans payment (protected)
- GET `/api/billing/status/:orderId` - Check payment status (protected)
- GET `/api/billing/history` - Payment history (protected)
- POST `/api/billing/notification` - Midtrans webhook

### Notifications
- GET `/api/notifications` - List notifications (protected)
- PUT `/api/notifications/:id/read` - Mark as read (protected)
- PUT `/api/notifications/read-all` - Mark all as read (protected)
- GET `/api/notifications/settings` - Get settings (protected)
- PUT `/api/notifications/settings` - Update settings (protected)

### Dashboard
- GET `/api/dashboard/stats` - Dashboard statistics (protected)

## Database

Menggunakan SQLite dengan file `data.db`. Database akan otomatis dibuat saat pertama kali menjalankan server.

## Monitoring

Server monitoring berjalan setiap menit menggunakan cron job. Setiap server akan dicek sesuai interval yang dikonfigurasi (1, 2, atau 5 menit).
