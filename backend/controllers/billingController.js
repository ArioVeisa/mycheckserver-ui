import { poolPromise } from '../config/db.js';
import { createTransaction, verifyNotification, checkTransactionStatus } from '../services/midtransService.js';
import { v4 as uuidv4 } from 'uuid';

const PRO_PLAN_PRICE = 100;

export const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = `MCS-${Date.now()}-${uuidv4().substring(0, 8)}`;

    const transaction = await createTransaction(
      orderId,
      PRO_PLAN_PRICE,
      req.user,
      { id: 'pro-plan', name: 'Pro Plan - 1 Bulan' }
    );

    const pool = await poolPromise;
    await pool.request()
      .input('userId', userId)
      .input('orderId', orderId)
      .input('amount', PRO_PLAN_PRICE)
      .input('plan', 'pro')
      .input('status', 'pending')
      .query(`
        INSERT INTO payments (user_id, order_id, amount, plan, status)
        VALUES (@userId, @orderId, @amount, @plan, @status)
      `);

    res.json({
      orderId,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Gagal membuat pembayaran' });
  }
};

export const handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    const statusResponse = await verifyNotification(notification);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const transactionId = statusResponse.transaction_id;
    const paymentType = statusResponse.payment_type;

    const pool = await poolPromise;
    const paymentResult = await pool.request()
      .input('orderId', orderId)
      .query('SELECT * FROM payments WHERE order_id = @orderId');

    const payment = paymentResult.recordset[0];
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    let status = 'pending';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        status = 'paid';

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await pool.request()
          .input('expiresAt', expiresAt.toISOString())
          .input('userId', payment.user_id)
          .query(`
            UPDATE users SET plan = 'pro', plan_expires_at = @expiresAt, updated_at = GETDATE()
            WHERE id = @userId
          `);

        await pool.request()
          .input('userId', payment.user_id)
          .input('type', 'payment_success')
          .input('title', 'Pembayaran Berhasil!')
          .input('message', `Selamat! Akun Anda telah diupgrade ke Pro hingga ${expiresAt.toLocaleDateString('id-ID')}`)
          .query(`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (@userId, @type, @title, @message)
          `);
      }
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      status = 'failed';
    } else if (transactionStatus === 'pending') {
      status = 'pending';
    }

    await pool.request()
      .input('status', status)
      .input('transactionId', transactionId)
      .input('paymentType', paymentType)
      .input('midtransResponse', JSON.stringify(statusResponse))
      .input('orderId', orderId)
      .query(`
        UPDATE payments SET 
          status = @status, 
          transaction_id = @transactionId,
          payment_type = @paymentType,
          midtrans_response = @midtransResponse,
          updated_at = GETDATE()
        WHERE order_id = @orderId
      `);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Notification handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const pool = await poolPromise;

    const paymentResult = await pool.request()
      .input('orderId', orderId)
      .input('userId', userId)
      .query('SELECT * FROM payments WHERE order_id = @orderId AND user_id = @userId');

    const payment = paymentResult.recordset[0];
    if (!payment) {
      return res.status(404).json({ error: 'Payment tidak ditemukan' });
    }

    if (payment.status === 'pending') {
      try {
        const midtransStatus = await checkTransactionStatus(orderId);

        let status = 'pending';
        if (midtransStatus.transaction_status === 'settlement' || midtransStatus.transaction_status === 'capture') {
          status = 'paid';

          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await pool.request()
            .input('expiresAt', expiresAt.toISOString())
            .input('userId', userId)
            .query(`
              UPDATE users SET plan = 'pro', plan_expires_at = @expiresAt, updated_at = GETDATE()
              WHERE id = @userId
            `);
        } else if (['deny', 'cancel', 'expire'].includes(midtransStatus.transaction_status)) {
          status = 'failed';
        }

        await pool.request()
          .input('status', status)
          .input('orderId', orderId)
          .query('UPDATE payments SET status = @status, updated_at = GETDATE() WHERE order_id = @orderId');

        payment.status = status;
      } catch (e) {
        console.log('Could not check Midtrans status:', e.message);
      }
    }

    res.json({
      orderId: payment.order_id,
      amount: payment.amount,
      plan: payment.plan,
      status: payment.status,
      paymentType: payment.payment_type,
      createdAt: payment.created_at
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT TOP 20 order_id, amount, plan, status, payment_type, created_at
        FROM payments WHERE user_id = @userId ORDER BY created_at DESC
      `);

    res.json({
      payments: result.recordset.map(p => ({
        orderId: p.order_id,
        amount: p.amount,
        plan: p.plan,
        status: p.status,
        paymentType: p.payment_type,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    const pool = await poolPromise;

    const paymentResult = await pool.request()
      .input('orderId', orderId)
      .input('userId', userId)
      .query('SELECT * FROM payments WHERE order_id = @orderId AND user_id = @userId');

    const payment = paymentResult.recordset[0];
    if (!payment) {
      return res.status(404).json({ error: 'Payment tidak ditemukan' });
    }

    if (payment.status === 'paid') {
      return res.json({ success: true, message: 'Payment sudah dikonfirmasi' });
    }

    try {
      const midtransStatus = await checkTransactionStatus(orderId);
      console.log('Midtrans status:', midtransStatus);

      if (midtransStatus.transaction_status === 'settlement' || midtransStatus.transaction_status === 'capture') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await pool.request()
          .input('expiresAt', expiresAt.toISOString())
          .input('userId', userId)
          .query(`
            UPDATE users SET plan = 'pro', plan_expires_at = @expiresAt, updated_at = GETDATE()
            WHERE id = @userId
          `);

        await pool.request()
          .input('paymentType', midtransStatus.payment_type || 'unknown')
          .input('orderId', orderId)
          .query(`
            UPDATE payments SET status = 'paid', payment_type = @paymentType, updated_at = GETDATE() 
            WHERE order_id = @orderId
          `);

        await pool.request()
          .input('userId', userId)
          .input('type', 'payment_success')
          .input('title', 'Pembayaran Berhasil!')
          .input('message', `Selamat! Akun Anda telah diupgrade ke Pro hingga ${expiresAt.toLocaleDateString('id-ID')}`)
          .query(`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (@userId, @type, @title, @message)
          `);

        return res.json({ success: true, message: 'Plan berhasil diupgrade ke Pro!' });
      } else {
        return res.json({ success: false, message: `Status: ${midtransStatus.transaction_status}` });
      }
    } catch (e) {
      console.error('Midtrans check error:', e);
      return res.status(500).json({ error: 'Gagal mengecek status pembayaran' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const getCurrentPlan = async (req, res) => {
  try {
    const user = req.user;
    const pool = await poolPromise;

    let daysRemaining = null;
    if (user.plan === 'pro' && user.plan_expires_at) {
      const expiresAt = new Date(user.plan_expires_at);
      const now = new Date();
      daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    }

    const serverCountResult = await pool.request()
      .input('userId', user.id)
      .query('SELECT COUNT(*) as count FROM servers WHERE user_id = @userId');

    const serverCount = serverCountResult.recordset[0].count;

    res.json({
      plan: user.plan,
      expiresAt: user.plan_expires_at,
      daysRemaining,
      limits: {
        maxServers: user.plan === 'pro' ? 'unlimited' : 1,
        currentServers: serverCount,
        minInterval: user.plan === 'pro' ? 1 : 5,
        logRetention: user.plan === 'pro' ? 30 : 7,
        whatsappNotif: user.plan === 'pro'
      }
    });
  } catch (error) {
    console.error('Get current plan error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
