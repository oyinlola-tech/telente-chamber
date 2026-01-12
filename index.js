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