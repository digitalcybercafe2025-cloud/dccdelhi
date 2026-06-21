
import { Application, MessageTemplate } from '../types';

export interface NotificationLog {
  id: string;
  type: 'SMS' | 'WhatsApp';
  to: string;
  message: string;
  timestamp: number;
  status: 'Sent' | 'Failed';
  provider: string;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'wa-sub-1',
    name: 'WA Submission Confirmation',
    type: 'WhatsApp',
    trigger: 'SUBMISSION',
    content: 'Hello [Name]! Your application for [Service] has been received. ID: [ID]. Track status at digitalmangolpuri.com',
    active: true
  },
  {
    id: 'wa-sub-2',
    name: 'WA Detailed Receipt',
    type: 'WhatsApp',
    trigger: 'SUBMISSION',
    content: 'Greetings from Digital Mangolpuri! 📄 We have successfully received your application for [Service] (ID: [ID]). Our team is now verifying your documents. You will get another update once processing begins. Stay tuned!',
    active: false
  },
  {
    id: 'sms-pay-1',
    name: 'SMS Payment Confirmation',
    type: 'SMS',
    trigger: 'PAYMENT',
    content: 'Payment successful for [Service]. Tracking ID: [ID]. Digital Mangolpuri.',
    active: false
  },
  {
    id: 'sms-pay-2',
    name: 'SMS Payment Receipt',
    type: 'SMS',
    trigger: 'PAYMENT',
    content: 'Dear [Name], your payment for [Service] (ID: [ID]) is confirmed. Visit digitalmangolpuri.com for tracking.',
    active: true
  },
  {
    id: 'wa-pay-1',
    name: 'WA Payment Confirmation',
    type: 'WhatsApp',
    trigger: 'PAYMENT',
    content: 'Dear [Name], your payment for [Service] (ID: [ID]) is successful. Visit digitalmangolpuri.com for tracking. Thank you!',
    active: true
  },
  {
    id: 'wa-status-1',
    name: 'WA Status Update',
    type: 'WhatsApp',
    trigger: 'STATUS_UPDATE',
    content: 'Hi [Name], status of your application [ID] ([Service]) is now: [Status]. Check updates at digitalmangolpuri.com',
    active: true
  }
];

const saveLog = (log: NotificationLog) => {
  const logs = JSON.parse(localStorage.getItem('mangolpuri_logs') || '[]');
  logs.unshift(log);
  localStorage.setItem('mangolpuri_logs', JSON.stringify(logs.slice(0, 50)));
};

export const sendWhatsAppNotification = async (mobile: string, message: string) => {
  console.log(`[WhatsApp Gateway] Sending to ${mobile}...`);
  await new Promise(resolve => setTimeout(resolve, 800));
  saveLog({
    id: `WA-${Math.random().toString(36).substr(2, 9)}`,
    type: 'WhatsApp',
    to: mobile,
    message,
    timestamp: Date.now(),
    status: 'Sent',
    provider: 'Twilio API'
  });
  return { success: true };
};

export const sendSMSNotification = async (mobile: string, message: string) => {
  console.log(`[SMS Gateway] Sending via Fast2SMS to ${mobile}...`);
  await new Promise(resolve => setTimeout(resolve, 600));
  saveLog({
    id: `SMS-${Math.random().toString(36).substr(2, 9)}`,
    type: 'SMS',
    to: mobile,
    message,
    timestamp: Date.now(),
    status: 'Sent',
    provider: 'Fast2SMS'
  });
  return { success: true };
};

export const processBotCommand = (input: string, applications: Application[]) => {
  const cleanInput = input.trim().toUpperCase();
  if (cleanInput.startsWith('TRACK')) {
    const appId = cleanInput.replace('TRACK', '').trim();
    const app = applications.find(a => a.id === appId || a.id === `APP-${appId}`);
    if (app) {
      return {
        message: `✅ Status for ${app.id} (${app.serviceName}):\n📍 Current Status: ${app.status}\n📅 Last Update: ${new Date(app.lastUpdate).toLocaleDateString()}\n💳 Payment ID: ${app.paymentId}\n\nThank you for choosing Digital Mangolpuri!`,
        found: true
      };
    }
    return {
      message: `❌ Sorry, I couldn't find any application with ID "${appId}". Please check the ID or visit our tracker page.`,
      found: false
    };
  }
  if (cleanInput === 'HI' || cleanInput === 'HELLO' || cleanInput === 'START') {
    return {
      message: `👋 Hello! I am the Digital Mangolpuri Assistant.\n\nType "TRACK [Application ID]" to check your status.\nExample: TRACK APP-123456`,
      found: true
    };
  }
  return {
    message: `🤖 I'm sorry, I don't understand that command. \n\nPlease type "TRACK [Application ID]" to get status updates.`,
    found: false
  };
};

export const getNotificationLogs = (): NotificationLog[] => {
  return JSON.parse(localStorage.getItem('mangolpuri_logs') || '[]');
};

export const clearNotificationLogs = () => {
  localStorage.removeItem('mangolpuri_logs');
};

// Template Management
export const getMessageTemplates = (): MessageTemplate[] => {
  const saved = localStorage.getItem('mangolpuri_templates');
  return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
};

export const saveMessageTemplates = (templates: MessageTemplate[]) => {
  localStorage.setItem('mangolpuri_templates', JSON.stringify(templates));
};

export const formatMessageFromTemplate = (
  trigger: MessageTemplate['trigger'],
  type: MessageTemplate['type'],
  data: { [key: string]: string }
): string => {
  const templates = getMessageTemplates();
  // Picks the first active template for the trigger and type
  const template = templates.find(t => t.trigger === trigger && t.type === type && t.active);
  if (!template) return '';

  let message = template.content;
  Object.keys(data).forEach(key => {
    message = message.split(`[${key}]`).join(data[key]);
  });
  return message;
};
