const fs = require('fs').promises;
const juice = require('juice');

const createEmailTransporter = () => {
  const nodemailer = require('nodemailer');
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
  const secure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;

  if (host) {
    return nodemailer.createTransport({
      host,
      port: port || 587,
      secure,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

const getEmailFrom = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.EMAIL_FROM_NAME) {
    return `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`;
  }
  return process.env.EMAIL_USER;
};

const inlineEmailTemplate = async (templatePath, cssPath, replacements = {}) => {
  let html = await fs.readFile(templatePath, 'utf-8');

  Object.entries(replacements).forEach(([key, value]) => {
    const safeValue = value === undefined || value === null ? '' : String(value);
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), safeValue);
  });

  if (cssPath) {
    const css = await fs.readFile(cssPath, 'utf-8');
    html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
    html = juice(html, { extraCss: css, preserveImportant: true });
  }

  return html;
};

const getBusinessInfo = () => ({
  name: process.env.BUSINESS_NAME || 'Legal Spectrum',
  phone: process.env.BUSINESS_PHONE || '',
  email: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER || '',
  address: process.env.BUSINESS_ADDRESS || 'Legal Spectrum Chambers, Okitipupa, Ondo State, Nigeria'
});

module.exports = {
  createEmailTransporter,
  getEmailFrom,
  inlineEmailTemplate,
  getBusinessInfo
};
