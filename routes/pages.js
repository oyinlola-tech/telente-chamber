const express = require('express');
const path = require('path');

const createPagesRouter = ({ baseDir, authenticateToken }) => {
  const router = express.Router();
  const publicDir = path.join(baseDir, 'public');

  router.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  router.get('/blog', (req, res) => {
    res.sendFile(path.join(publicDir, 'blog.html'));
  });

  router.get('/blog/:slug', (req, res) => {
    res.sendFile(path.join(publicDir, 'blog-detail.html'));
  });

  router.get('/contact', (req, res) => {
    res.sendFile(path.join(publicDir, 'contact.html'));
  });

  router.get('/about', (req, res) => {
    res.sendFile(path.join(publicDir, 'about.html'));
  });

  router.get('/practice', (req, res) => {
    res.sendFile(path.join(publicDir, 'practice.html'));
  });

  router.get('/faq', (req, res) => {
    res.sendFile(path.join(publicDir, 'faq.html'));
  });

  router.get('/privacy', (req, res) => {
    res.sendFile(path.join(publicDir, 'privacy.html'));
  });

  router.get('/terms', (req, res) => {
    res.sendFile(path.join(publicDir, 'terms.html'));
  });

  router.get('/admin/login', (req, res) => {
    res.sendFile(path.join(publicDir, 'login.html'));
  });

  router.get('/admin/dashboard', authenticateToken, (req, res) => {
    res.sendFile(path.join(publicDir, 'dashboard.html'));
  });

  router.get('/admin/forgot-password', (req, res) => {
    res.sendFile(path.join(publicDir, 'forgot-password.html'));
  });

  router.get('/admin/reset-password/:token', (req, res) => {
    res.sendFile(path.join(publicDir, 'reset-password.html'));
  });

  router.get('/unsubscribe', (req, res) => {
    res.sendFile(path.join(publicDir, 'unsubscribe.html'));
  });

  return router;
};

module.exports = { createPagesRouter };
