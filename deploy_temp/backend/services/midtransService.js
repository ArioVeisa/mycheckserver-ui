import midtransClient from 'midtrans-client';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export const createTransaction = async (orderId, amount, user, itemDetails) => {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    item_details: [{
      id: itemDetails.id || 'pro-plan',
      price: amount,
      quantity: 1,
      name: itemDetails.name || 'Pro Plan Subscription'
    }],
    customer_details: {
      first_name: user.name,
      email: user.email
    },
    callbacks: {
      finish: `${process.env.FRONTEND_URL}/billing?status=success`,
      error: `${process.env.FRONTEND_URL}/billing?status=error`,
      pending: `${process.env.FRONTEND_URL}/billing?status=pending`
    }
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction;
};

export const verifyNotification = async (notificationJson) => {
  try {
    const statusResponse = await coreApi.transaction.notification(notificationJson);
    return statusResponse;
  } catch (error) {
    console.error('Midtrans notification verification error:', error);
    throw error;
  }
};

export const checkTransactionStatus = async (orderId) => {
  try {
    const status = await coreApi.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Midtrans status check error:', error);
    throw error;
  }
};
