const axios = require('axios');

// Format Ghana phone number to international format
// e.g. 0241234567 -> 233241234567
const formatGhanaPhone = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Send SMS using available provider (Arkesel, Hubtel, Twilio, or Console Logger)
 */
const sendSMS = async ({ to, message }) => {
  const recipient = formatGhanaPhone(to || process.env.OWNER_PHONE_NUMBER);
  
  if (!recipient) {
    console.log(`📱 [SMS LOG - NO RECIPIENT] Message: "${message}"`);
    return { success: false, reason: 'No phone number provided' };
  }

  // 1. ARKESEL (Ghana SMS Gateway - https://arkesel.com)
  if (process.env.ARKESEL_API_KEY) {
    try {
      const res = await axios.get('https://sms.arkesel.com/sms/api', {
        params: {
          action: 'send-sms',
          api_key: process.env.ARKESEL_API_KEY,
          to: recipient,
          from: process.env.SMS_SENDER_ID || 'FrostStock',
          sms: message,
        },
      });
      console.log(`📲 [SMS SENT via Arkesel to ${recipient}]:`, res.data);
      return { success: true, provider: 'arkesel', data: res.data };
    } catch (err) {
      console.error('❌ Arkesel SMS failed:', err.message);
    }
  }

  // 2. FASTREACH / CUSTOM GHANA GATEWAY
  if (process.env.FASTREACH_API_KEY) {
    try {
      const res = await axios.post(
        process.env.FASTREACH_URL || 'https://api.fastreach.com/v1/sms/send',
        {
          recipient,
          sender: process.env.SMS_SENDER_ID || 'FrostStock',
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FASTREACH_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`📲 [SMS SENT via FastReach to ${recipient}]:`, res.data);
      return { success: true, provider: 'fastreach', data: res.data };
    } catch (err) {
      console.error('❌ FastReach SMS failed:', err.message);
    }
  }

  // 2. HUBTEL (Ghana Local Gateway)
  if (process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET) {
    try {
      const auth = Buffer.from(`${process.env.HUBTEL_CLIENT_ID}:${process.env.HUBTEL_CLIENT_SECRET}`).toString('base64');
      const res = await axios.post(
        'https://api.hubtel.com/v1/messages/send',
        {
          From: process.env.SMS_SENDER_ID || 'FrostStock',
          To: recipient,
          Content: message,
        },
        {
          headers: { Authorization: `Basic ${auth}` },
        }
      );
      console.log(`📲 [SMS SENT via Hubtel to ${recipient}]:`, res.data);
      return { success: true, provider: 'hubtel', data: res.data };
    } catch (err) {
      console.error('❌ Hubtel SMS failed:', err.message);
    }
  }

  // 3. TWILIO (Global Gateway)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+${recipient}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', message);

      const res = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        params,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log(`📲 [SMS SENT via Twilio to +${recipient}]:`, res.data.sid);
      return { success: true, provider: 'twilio', data: res.data };
    } catch (err) {
      console.error('❌ Twilio SMS failed:', err.response?.data || err.message);
    }
  }

  // 4. Fallback Logger (Simulated SMS in Console for Dev/Testing)
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 [MOCK SMS SENT TO ${recipient || 'STORE OWNER'}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  return { success: true, provider: 'mock_console', recipient, message };
};

/**
 * Trigger Low Stock SMS Alert to Store Owner
 */
const triggerLowStockSMS = async (product, newStock) => {
  try {
    const ownerPhone = process.env.OWNER_PHONE_NUMBER || '0240000000';
    
    // Spam protection: check if alert was sent in the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    if (product.lastLowStockAlertSentAt && product.lastLowStockAlertSentAt > twelveHoursAgo) {
      console.log(`⏳ SMS alert skipped for ${product.name} (Alert already sent within last 12 hours)`);
      return;
    }

    const message = `🧊 FROSTSTOCK ALERT: Low stock for ${product.name}! Remaining: ${newStock} ${product.unit} (Minimum threshold: ${product.minimumStock} ${product.unit}). Please reorder soon!`;

    const result = await sendSMS({ to: ownerPhone, message });

    // Update product last alert timestamp
    const Product = require('../models/Product');
    await Product.findByIdAndUpdate(product._id, { lastLowStockAlertSentAt: new Date() });

    return result;
  } catch (error) {
    console.error('❌ Error triggering low stock SMS:', error.message);
  }
};

module.exports = { sendSMS, triggerLowStockSMS, formatGhanaPhone };
