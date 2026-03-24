const express = require('express');
const path = require('path');

const createApiRouter = ({ pool, upload, authenticateToken, email, baseDir }) => {
  const router = express.Router();
  const publicDir = path.join(baseDir, 'public');

  router.get('/blogs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const status = req.query.status || 'published';

      if (status === 'all' || (req.headers.authorization && req.query.status === undefined)) {
        return authenticateToken(req, res, async () => {
          let query = 'SELECT * FROM blogs ORDER BY created_at DESC';
          const params = [];

          if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
          }

          const [blogs] = await pool.query(query, params);
          res.json(blogs);
        });
      }

      let query = 'SELECT * FROM blogs WHERE status = ? ORDER BY created_at DESC';
      const params = [status];

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const [blogs] = await pool.query(query, params);
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/blogs/:id', async (req, res, next) => {
    if (!/^\d+$/.test(req.params.id)) {
      return next();
    }

    return authenticateToken(req, res, async () => {
      try {
        const blogId = parseInt(req.params.id, 10);
        const [blogs] = await pool.query('SELECT * FROM blogs WHERE id = ?', [blogId]);

        if (blogs.length === 0) {
          return res.status(404).json({ error: 'Blog not found' });
        }

        res.json(blogs[0]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  router.get('/blogs/:slug', async (req, res) => {
    try {
      const [blogs] = await pool.query(
        'SELECT * FROM blogs WHERE slug = ? AND status = "published"',
        [req.params.slug]
      );

      if (blogs.length === 0) {
        return res.status(404).json({ error: 'Blog not found' });
      }

      res.json(blogs[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/blogs', authenticateToken, upload.single('image'), async (req, res) => {
    try {
      const { title, content, excerpt, status } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');

      let imagePath = null;
      if (req.file) {
        const fs = require('fs');
        const newPath = `uploads/blogs/${req.file.filename}`;
        fs.renameSync(req.file.path, newPath);
        imagePath = newPath;
      }

      const [result] = await pool.query(
        'INSERT INTO blogs (title, slug, content, excerpt, image, status) VALUES (?, ?, ?, ?, ?, ?)',
        [title, slug, content, excerpt, imagePath, status || 'published']
      );

      if ((status || 'published') === 'published') {
        try {
          const [subscribers] = await pool.query(
            "SELECT email, unsubscribe_token FROM subscribers WHERE status = 'subscribed'"
          );
          if (subscribers.length > 0) {
            const transporter = email.createEmailTransporter();
            const templatePath = path.join(publicDir, 'new-post-notification-template.html');
            const cssPath = path.join(publicDir, 'css', 'emails', 'new-post-notification-template.css');
            const postLink = `${req.protocol}://${req.get('host')}/blog/${slug}`;

            const business = email.getBusinessInfo();
            const mailOptions = {
              from: email.getEmailFrom(),
              subject: `New Post: ${title}`
            };

            for (const subscriber of subscribers) {
              const unsubscribeLink = `${req.protocol}://${req.get('host')}/unsubscribe?token=${subscriber.unsubscribe_token}`;
              const personalizedHtml = await email.inlineEmailTemplate(
                templatePath,
                cssPath,
                {
                  postTitle: title,
                  postExcerpt: excerpt || content.substring(0, 150) + '...',
                  postLink,
                  unsubscribeLink,
                  address: business.address
                }
              );
              await transporter.sendMail({ ...mailOptions, to: subscriber.email, html: personalizedHtml });
            }
            console.log(`Sent new post notification to ${subscribers.length} subscribers.`);
          }
        } catch (emailError) {
          console.error('Failed to send newsletter notification:', emailError);
        }
      }

      res.json({ id: result.insertId, slug, message: 'Blog created successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/blogs/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
      const blogId = parseInt(req.params.id, 10);
      if (isNaN(blogId)) {
        return res.status(400).json({ error: 'Invalid blog ID' });
      }
      const { title, content, excerpt, status } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const [existing] = await pool.query('SELECT image FROM blogs WHERE id = ?', [blogId]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');

      let imagePath = existing[0].image || null;
      if (req.file) {
        const fs = require('fs');
        const newPath = `uploads/blogs/${req.file.filename}`;
        fs.renameSync(req.file.path, newPath);
        imagePath = newPath;

        if (existing[0].image) {
          const fsPromises = require('fs').promises;
          const oldPath = path.join(baseDir, existing[0].image);
          try {
            await fsPromises.unlink(oldPath);
          } catch (err) {
            console.error(`Failed to delete image file: ${oldPath}`, err);
          }
        }
      }

      await pool.query(
        'UPDATE blogs SET title = ?, slug = ?, content = ?, excerpt = ?, image = ?, status = ? WHERE id = ?',
        [title, slug, content, excerpt, imagePath, status || 'published', blogId]
      );

      res.json({ id: blogId, slug, message: 'Blog updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/blogs/:id', authenticateToken, async (req, res) => {
    try {
      const blogId = parseInt(req.params.id);

      if (isNaN(blogId)) {
        return res.status(400).json({ error: 'Invalid blog ID' });
      }

      const [blogs] = await pool.query('SELECT image FROM blogs WHERE id = ?', [blogId]);

      if (blogs.length === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      const blog = blogs[0];

      if (blog.image) {
        const fs = require('fs').promises;
        const imagePath = path.join(baseDir, blog.image);
        try {
          await fs.unlink(imagePath);
        } catch (err) {
          console.error(`Failed to delete image file: ${imagePath}`, err);
        }
      }

      await pool.query('DELETE FROM blogs WHERE id = ?', [blogId]);

      res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({ error: 'An error occurred while deleting the blog post.' });
    }
  });

  router.post('/subscribe', async (req, res) => {
    try {
      const { email: subscriberEmail } = req.body;
      if (!subscriberEmail || !/^\S+@\S+\.\S+$/.test(subscriberEmail)) {
        return res.status(400).json({ error: 'A valid email is required.' });
      }

      const crypto = require('crypto');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      const [result] = await pool.query(
        `INSERT INTO subscribers (email, unsubscribe_token, status) VALUES (?, ?, 'subscribed')
         ON DUPLICATE KEY UPDATE status = 'subscribed', unsubscribe_token = ?`,
        [subscriberEmail, unsubscribeToken, unsubscribeToken]
      );

      if (result.affectedRows === 1 && result.insertId > 0) {
        // New subscription
      } else if (result.affectedRows === 2) {
        // Re-subscription (updated existing row)
      } else {
        return res.json({ message: 'You are already subscribed to our newsletter.' });
      }

      const transporter = email.createEmailTransporter();
      const unsubscribeLink = `${req.protocol}://${req.get('host')}/unsubscribe?token=${unsubscribeToken}`;
      const business = email.getBusinessInfo();
      const template = await email.inlineEmailTemplate(
        path.join(publicDir, 'subscription-confirmation-template.html'),
        path.join(publicDir, 'css', 'emails', 'subscription-confirmation-template.css'),
        { unsubscribeLink, address: business.address }
      );

      await transporter.sendMail({
        from: email.getEmailFrom(),
        to: subscriberEmail,
        subject: 'Subscription Confirmed - Legal Spectrum',
        html: template
      });

      res.json({ message: 'Thank you for subscribing! A confirmation email has been sent.' });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'An error occurred during subscription.' });
    }
  });

  router.get('/unsubscribe', async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: 'Unsubscribe token is required.' });
      }

      const [subscribers] = await pool.query(
        'SELECT email FROM subscribers WHERE unsubscribe_token = ?',
        [token]
      );

      if (subscribers.length === 0) {
        return res.status(400).json({ error: 'Invalid unsubscribe link or you are already unsubscribed.' });
      }

      const subscriberEmail = subscribers[0].email;

      try {
        const transporter = email.createEmailTransporter();
        const business = email.getBusinessInfo();
        const template = await email.inlineEmailTemplate(
          path.join(publicDir, 'unsubscribe-confirmation-template.html'),
          path.join(publicDir, 'css', 'emails', 'unsubscribe-confirmation-template.css'),
          { address: business.address }
        );

        await transporter.sendMail({
          from: email.getEmailFrom(),
          to: subscriberEmail,
          subject: 'Unsubscribe Confirmation - Legal Spectrum',
          html: template
        });
      } catch (emailError) {
        console.error('Error sending unsubscribe confirmation:', emailError);
      }

      await pool.query('DELETE FROM subscribers WHERE unsubscribe_token = ?', [token]);

      res.json({ message: 'You have been successfully unsubscribed from our newsletter.' });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: 'An error occurred while unsubscribing.' });
    }
  });

  router.get('/testimonials', async (req, res) => {
    try {
      const approvedOnly = req.query.approved !== 'false';

      const query = approvedOnly
        ? 'SELECT * FROM testimonials WHERE approved = true ORDER BY created_at DESC'
        : 'SELECT * FROM testimonials ORDER BY created_at DESC';

      const [testimonials] = await pool.query(query);
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/testimonials', async (req, res) => {
    try {
      const { name, email: testimonialEmail, rating, message } = req.body;

      if (!name || !message || !rating) {
        return res.status(400).json({ error: 'Name, message, and rating are required' });
      }

      const ratingNum = parseInt(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      await pool.query(
        'INSERT INTO testimonials (name, email, rating, message) VALUES (?, ?, ?, ?)',
        [name, testimonialEmail, ratingNum, message]
      );

      res.json({ message: 'Testimonial submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/testimonials/:id/approve', authenticateToken, async (req, res) => {
    try {
      await pool.query(
        'UPDATE testimonials SET approved = ? WHERE id = ?',
        [req.body.approved, req.params.id]
      );

      res.json({ message: 'Testimonial updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/contact', async (req, res) => {
    try {
      const { name, email: contactEmail, phone, subject, message } = req.body;

      if (!name || !contactEmail || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }

      await pool.query(
        'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
        [name, contactEmail, phone, subject, message]
      );

      res.json({ message: 'Message sent successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/contacts', authenticateToken, async (req, res) => {
    try {
      const [contacts] = await pool.query(
        'SELECT * FROM contacts ORDER BY created_at DESC'
      );
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);

      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'Invalid contact ID' });
      }

      const [result] = await pool.query(
        'DELETE FROM contacts WHERE id = ?',
        [contactId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Delete contact error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/admin/login', async (req, res) => {
    try {
      const { email: adminEmail, password } = req.body;

      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const bcrypt = require('bcryptjs');
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({ message: 'Login successful', token: token, user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/admin/forgot-password', async (req, res) => {
    try {
      const { email: adminEmail } = req.body;

      if (!adminEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
      if (users.length === 0) {
        return res.json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
      }

      const user = users[0];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

      await pool.query(
        'INSERT INTO password_resets (user_id, otp, email, expires_at) VALUES (?, ?, ?, ?)',
        [user.id, otp, adminEmail, new Date(expiresAt)]
      );

      const business = email.getBusinessInfo();
      const message = await email.inlineEmailTemplate(
        path.join(publicDir, 'forgot-password-otp-template.html'),
        path.join(publicDir, 'css', 'emails', 'forgot-password-otp-template.css'),
        { otp, address: business.address }
      );

      const transporter = email.createEmailTransporter();
      await transporter.sendMail({
        from: email.getEmailFrom(),
        to: adminEmail,
        subject: 'Password Reset OTP - Legal Spectrum',
        html: message
      });

      res.json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/admin/verify-otp', async (req, res) => {
    try {
      const { email: adminEmail, otp } = req.body;
      if (!adminEmail || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      const [otps] = await pool.query(
        `
        SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = FALSE AND expires_at > NOW()
      `,
        [adminEmail, otp]
      );

      if (otps.length === 0) {
        await pool.query(
          `
          UPDATE password_resets SET attempts = attempts + 1 WHERE email = ? AND expired_at > NOW()
        `,
          [adminEmail]
        );
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      const otpRecord = otps[0];
      if (otpRecord.attempts >= 5) {
        return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
      }

      const crypto = require('crypto');
      const sessionToken = crypto.randomBytes(32).toString('hex');

      const sessionExpires = Date.now() + 5 * 60 * 1000;
      res.json({ success: true, message: 'OTP verified successfully', reset_token: sessionToken, expires_at: sessionExpires });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ error: 'Error verifying OTP' });
    }
  });

  router.post('/admin/reset-password', async (req, res) => {
    try {
      const { email: adminEmail, otp, password } = req.body;
      if (!adminEmail || !otp || !password) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const [otps] = await pool.query(
        `
        SELECT pr.* FROM password_resets pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.email = ? AND pr.otp = ? AND pr.used = FALSE AND pr.expires_at > NOW()
      `,
        [adminEmail, otp]
      );
      if (otps.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      const otpRecord = otps[0];

      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
      if (users.length === 0) {
        return res.status(400).json({ error: 'User not found' });
      }
      const user = users[0];

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, otpRecord.user_id]);
      await pool.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [otpRecord.id]);
      await pool.query('DELETE FROM password_resets WHERE user_id = ?', [otpRecord.user_id]);
      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Error resetting password' });
    }
  });

  router.post('/admin/resend-otp', async (req, res) => {
    try {
      const { email: adminEmail } = req.body;
      if (!adminEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
      if (users.length === 0) {
        return res.json({ message: 'If an account exists with this email, we will send you an email to reset your password.' });
      }
      const user = users[0];

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await pool.query('DELETE FROM password_resets WHERE user_id = ? AND used = FALSE', [user.id]);
      await pool.query(
        'INSERT INTO password_resets (user_id, otp, expires_at) VALUES (?, ?, ?)',
        [user.id, otp, expiresAt]
      );
      const business = email.getBusinessInfo();
      const message = await email.inlineEmailTemplate(
        path.join(publicDir, 'resend-otp-template.html'),
        path.join(publicDir, 'css', 'emails', 'resend-otp-template.css'),
        { otp, address: business.address }
      );

      const transporter = email.createEmailTransporter();
      await transporter.sendMail({
        from: email.getEmailFrom(),
        to: adminEmail,
        subject: 'New Password Reset OTP - Legal Spectrum',
        html: message
      });
      res.json({ message: 'If an account exists with this email, we will send you an email to reset your password.' });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ error: 'Error resending OTP' });
    }
  });

  router.post('/admin/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  });

  router.get('/admin/check-auth', authenticateToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
  });

  router.post('/send-email', authenticateToken, async (req, res) => {
    try {
      const { to, subject, message, type, recordId } = req.body;

      const transporter = email.createEmailTransporter();

      let htmlToSend;
      let name = 'Valued Client';
      const business = email.getBusinessInfo();

      try {
        if (type === 'contact' && recordId) {
          const [contacts] = await pool.query('SELECT name FROM contacts WHERE id = ?', [recordId]);
          if (contacts.length > 0) {
            name = contacts[0].name;
          }
          htmlToSend = await email.inlineEmailTemplate(
            path.join(publicDir, 'contact-reply-template.html'),
            path.join(publicDir, 'css', 'emails', 'contact-reply-template.css'),
            {
              name,
              message: message.replace(/\n/g, '<br>'),
              address: business.address
            }
          );
        } else if (type === 'testimonial' && recordId) {
          const [testimonials] = await pool.query('SELECT name FROM testimonials WHERE id = ?', [recordId]);
          if (testimonials.length > 0) {
            name = testimonials[0].name;
          }
          htmlToSend = await email.inlineEmailTemplate(
            path.join(publicDir, 'testimonial-reply-template.html'),
            path.join(publicDir, 'css', 'emails', 'testimonial-reply-template.css'),
            {
              name,
              message: message.replace(/\n/g, '<br>'),
              address: business.address
            }
          );
        } else {
          htmlToSend = `<div>${message.replace(/\n/g, '<br>')}</div>`;
        }
      } catch (templateError) {
        console.error('Error reading email template:', templateError);
        htmlToSend = `<div>${message.replace(/\n/g, '<br>')}</div>`;
      }

      const mailOptions = {
        from: email.getEmailFrom(),
        to: to,
        subject: subject,
        text: message,
        html: htmlToSend
      };

      await transporter.sendMail(mailOptions);

      if (type === 'contact' && recordId) {
        await pool.query('UPDATE contacts SET replied = true WHERE id = ?', [recordId]);
      } else if (type === 'testimonial' && recordId) {
        await pool.query('UPDATE testimonials SET replied = true WHERE id = ?', [recordId]);
      }

      res.json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

module.exports = { createApiRouter };
