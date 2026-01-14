const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { pool, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(helmet({
  contentSecurityPolicy: false, 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use('/api/', limiter);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/blog/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const authenticateToken = (req, res, next) => {
  const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog-detail.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin/dashboard', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get('/admin/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/api/blogs', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const status = req.query.status || 'published';
    
    let query = 'SELECT * FROM blogs WHERE status = ? ORDER BY created_at DESC';
    let params = [status];
    
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

app.get('/api/blogs/:slug', async (req, res) => {
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

app.post('/api/blogs', authenticateToken, upload.single('image'), async (req, res) => {
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
    
    res.json({ id: result.insertId, slug, message: 'Blog created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/testimonials', async (req, res) => {
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

app.post('/api/testimonials', async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    
    if (!name || !message || !rating) {
      return res.status(400).json({ error: 'Name, message, and rating are required' });
    }
    
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    await pool.query(
      'INSERT INTO testimonials (name, email, rating, message) VALUES (?, ?, ?, ?)',
      [name, email, ratingNum, message]
    );
    
    res.json({ message: 'Testimonial submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/testimonials/:id/approve', authenticateToken, async (req, res) => {
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
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    await pool.query(
      'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, subject, message]
    );
    
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const [contacts] = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
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

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
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
    
    res.json({ message: 'Login successful', token: token, user: { id: user.id, email: user.email} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // For security, do not reveal that the email does not exist
      return res.json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
    }

    const user = users[0];

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    //Delete any existing OTPs for the user
    await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

    // Store OTP in password_resets table
    await pool.query(
      'INSERT INTO password_resets (user_id, otp, expires_at) VALUES (?, ?, ?)',
      [user.id, otp, new Date(expiresAt)]
    );

    //Email content with OTP
    const message = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px;">Password Reset Request</h2>
    <p> You requested a password reset for your Legl Spectrum admin account.</p>
    <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; text-align: center; margin: 20px 0;"> 
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;"> Your One-Time Password (OTP) is:</p>
    <div style="font-size: 14px; font-weight: bold; color: #000000; letter-spacing: 10px; margin: 10px 0;">${otp}</div>
    <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"> This OTP is valid for 10 minutes.</p></div>
    <p><strong>Instructions:</strong></p>
    <ol style="margin: 15px 0; padding-left: 20px;">
    <li>Go to the password reset page.</li>
    <li>Enter your email address</li>
    <li>Enter the OTP provided above.</li>
    <li>Create a new password for your account.</li>
    </ol>
    <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #000000;">
    <p style="margiin: 0; font-size: 14px;">
    <strong> Security Notice:</strong> <br>
    Never share your OTP with anyone.<br>
    If you did not request a password reset, please ignore this email or contact support immediately.</p>
    </div>
    <p style="font-size: 14px; color: #666; margin-top: 30px;"> Best regards,<br> Legal Spectrum Team</p>
    </div>`;
    // Send OTP via email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Legal Spectrum',
      html: message
    });
    res.json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
app.post('/api/admin/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

  // Check OTP
  const [otps] = await pool.query(`
    SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = FALSE AND expires_at > NOW()
  `, [email, otp]);

  if (otps.length === 0) {
    //increment attempts for existing OTP
    await pool.query(`
      UPDATE password_resets SET attempts = attempts + 1 WHERE email = ? AND expired_at > NOW()
    `, [email]);
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const otpRecord = otps[0];
  // Check if too many attempts
  if (otpRecord.attempts >= 5) {
    return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
  }

  // Mark OTP as used
  await pool.query(`
    UPDATE password_resets SET used = TRUE WHERE id = ?
  `, [otpRecord.id]);

  // Create a reset token the reset session
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');

  // Store session token temporarily (Valid for 5 minutes)
  const sessionExpires = Date.now() + 5 * 60 * 1000; // 5 minutes from now
  res.json({ success: true, message: 'OTP verified successfully', reset_token: sessionToken, expires_at: sessionExpires });
  } catch (error) {
    console.error('OTP verification error:', error);

    res.status(500).json({ error: 'Error verifying OTP' });
  }
});

//Reset Password with OTP verification
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

// Validate password strength
if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters long' });
}

// Verify OTP again for security
    const [otps] = await pool.query(`
      SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = FALSE AND expires_at > NOW()
    `, [email, otp]);
    if (otps.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const otpRecord = otps[0];
    //Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const user = users[0];

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password 
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    // Mark OTP as used
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [otpRecord.id]);
    // Delete all reset records for this user
    await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});
  // Resend OTP
  app.post('/api/admin/resend-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

    // Check if user exists
  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    // For security, do not reveal that the email does not exist
    return res.json({ message: 'If an account exists with this email, we will send you an email to reset your password.' });
  }
  const user = users[0];

  // Generate a new 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  //Delete any existing OTPs for the user
  await pool.query('DELETE FROM password_resets WHERE user_id = ? AND used = FALSE', [user.id]);
  // Store new OTP in password_resets table
  await pool.query(
    'INSERT INTO password_resets (user_id, otp, expires_at) VALUES (?, ?, ?)',
    [user.id, otp, expiresAt]
  );
// Email content with OTP
  const message = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px;">New Password Reset OTP</h2>
  <p> You requested a new OTP for your Legal Spectrum admin account.</p>
  <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; text-align: center; margin: 20px 0;"> 
  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;"> Your One-Time Password (OTP) is:</p>
  <div style="font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 10px; margin: 10px 0;">${otp}</div>
  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"> This OTP is valid for 10 minutes.</p></div>
  <p><strong>Instructions:</strong></p>
  <ol style="margin: 15px 0; padding-left: 20px;">
  <li>Go to the password reset page.</li>
  <li>Enter your email address</li>
  <li>Enter the OTP provided above.</li></ol></div>`;
  // Send OTP via email
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'New Password Reset OTP - Legal Spectrum',
    html: message
  });
  res.json({ message: 'If an account exists with this email, we will send you an email to reset your password.' });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ error: 'Error resending OTP' });
    }
  });

// Reset password endpoint
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or OTP' });
    }
    const user = users[0];
    if (user.reset_otp !== otp || !user.reset_otp_expiry || new Date() > new Date(user.reset_otp_expiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?', [hashedPassword, user.id]);
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/admin/check-auth', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

app.post('/api/send-email', authenticateToken, async (req, res) => {
  try {
    const { to, subject, message, type, recordId } = req.body;
    
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: message,
      html: `<div>${message.replace(/\n/g, '<br>')}</div>`
    };
    
    await transporter.sendMail(mailOptions);
    
    if (type === 'contact' && recordId) {
      await pool.query('UPDATE contacts SET replied = true WHERE id = ?', [recordId]);
    } else if (type === 'testimonial' && recordId) {
      await pool.query('UPDATE testimonials SET replied = true WHERE id = ?', [recordId]);
    }
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});