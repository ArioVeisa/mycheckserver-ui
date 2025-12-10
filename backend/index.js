import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import billingRoutes from './routes/billing.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import { runMonitoringCycle, sendTestEmail, sendDailyStatusReport } from './services/monitorService.js';
import { authenticate } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:8080',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config/midtrans', (req, res) => {
  res.json({
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
  });
});

// Send test email / status report
app.post('/api/send-report', authenticate, async (req, res) => {
  try {
    const result = await sendTestEmail(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Send report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from frontend build
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

cron.schedule('* * * * *', async () => {
  console.log('Running monitoring cycle...');
  try {
    await runMonitoringCycle();
  } catch (error) {
    console.error('Monitoring cycle error:', error);
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║     MyCheckServer Backend is running!        ║
  ║                                              ║
  ║     Port: ${PORT}                              ║
  ║     Mode: ${process.env.NODE_ENV || 'development'}                      ║
  ║                                              ║
  ║     Midtrans: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'Production' : 'Sandbox'}                     ║
  ╚══════════════════════════════════════════════╝
  `);
});
