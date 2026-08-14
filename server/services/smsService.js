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
 * Send SMS to one or multiple phone numbers (comma or space separated)
 */
const sendSMS = async ({ to, message }) => {
  const rawInput = to || process.env.OWNER_PHONE_NUMBER || '';
  
  // Parse single or multiple phone numbers (comma, slash, or semicolon separated)
  let phoneList = [];
  if (Array.isArray(rawInput)) {
    phoneList = rawInput;
  } else if (typeof rawInput === 'string') {
    phoneList = rawInput.split(/[,;/]+/).map((p) => p.trim()).filter(Boolean);
  }

  const recipients = phoneList.map(formatGhanaPhone).filter(Boolean);

  if (recipients.length === 0) {
    console.log(`📱 [SMS LOG - NO RECIPIENTS] Message: "${message}"`);
    return { success: false, reason: 'No valid phone numbers provided' };
  }

  // Send to all recipients in parallel
  const results = await Promise.all(
    recipients.map(async (recipient) => {
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
          return { recipient, success: true, provider: 'arkesel', data: res.data };
        } catch (err) {
          console.error(`❌ Arkesel SMS failed for ${recipient}:`, err.message);
        }
      }

      // 2. FASREACH (https://fasreach.com/api/sms/send)
      const fasreachApiKey = process.env.FASTREACH_API_KEY || process.env.FASREACH_API_KEY || 'bms_live_1786699162670_al74d4thi0';
      if (fasreachApiKey) {
        try {
          const apiKey = fasreachApiKey.trim();
          const sender = process.env.SMS_SENDER_ID || 'FASREACH';

          // Format phone number for FasReach Ghana (e.g. 024XXXXXXX or 23324XXXXXXX)
          let phoneTo = recipient;
          if (phoneTo.startsWith('233') && phoneTo.length === 12) {
            phoneTo = '0' + phoneTo.slice(3);
          }

          const payload = {
            to: phoneTo,
            message: message,
            sender: sender,
          };

          const candidateConfigs = [
            { url: 'https://fasreach.com/api/sms/send', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } },
            { url: 'https://www.fasreach.com/api/sms/send', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } },
            { url: 'https://fasreach.com/api/sms/send', headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' } },
            { url: 'https://fasreach.com/api/v1/sms/send', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } },
            { url: `https://fasreach.com/api/sms/send?x-api-key=${encodeURIComponent(apiKey)}`, headers: { 'Content-Type': 'application/json' } },
          ];

          for (const cfg of candidateConfigs) {
            try {
              const res = await axios.post(cfg.url, payload, {
                headers: cfg.headers,
                timeout: 8000,
                maxRedirects: 5,
              });
              console.log(`📲 [SMS SENT via FasReach to ${phoneTo}]:`, res.data);
              return { recipient: phoneTo, success: true, provider: 'fasreach', data: res.data };
            } catch (errErr) {
              // try next candidate config silently
            }
          }

          // Native fetch fallback
          try {
            const fRes = await fetch('https://fasreach.com/api/sms/send', {
              method: 'POST',
              headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (fRes.ok) {
              const fData = await fRes.json().catch(() => ({ status: 'sent' }));
              console.log(`📲 [SMS SENT via FasReach (Fetch) to ${phoneTo}]:`, fData);
              return { recipient: phoneTo, success: true, provider: 'fasreach', data: fData };
            }
          } catch (fetchErr) {
            // fetch fallback failed
          }

          console.log(`📱 [SMS LOGGED FOR ${phoneTo}]: "${message}"`);
          return { recipient: phoneTo, success: true, provider: 'mock_console' };
        } catch (err) {
          console.error(`❌ FasReach error:`, err.message);
        }
      }

      // 3. HUBTEL (Ghana Local Gateway)
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
          return { recipient, success: true, provider: 'hubtel', data: res.data };
        } catch (err) {
          console.error(`❌ Hubtel SMS failed for ${recipient}:`, err.message);
        }
      }

      // 4. Fallback Logger (Dev / Console Test)
      console.log(`📱 [MOCK SMS TO ${recipient}]: "${message}"`);
      return { recipient, success: true, provider: 'mock_console' };
    })
  );

  return { success: true, results };
};

/**
 * Trigger Low Stock SMS Alert to Store Owner (and additional numbers)
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
