# Spectrum Legal - Barristers and Solicitors

A modern, professional website for Spectrum Legal, a law firm providing expert legal services in corporate law, intellectual property litigation, and complex civil disputes.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Admin Dashboard](#admin-dashboard)
- [Contact Form](#contact-form)
- [Blog System](#blog-system)
- [Testimonials](#testimonials)
- [Email Configuration](#email-configuration)
- [Frontend Features](#frontend-features)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## ✨ Features

### Public Website
- **Responsive Design**: Mobile-first approach with elegant Georgian serif typography
- **Home Page**: Hero section, about section, services showcase, and testimonials
- **Blog System**: Display published blog articles with full article pages and related articles
- **Contact Page**: Contact form with email validation and WhatsApp integration
- **Mobile Navigation**: Sticky header with smooth navigation
- **WhatsApp Integration**: Direct messaging button for client inquiries
- **Dynamic Footer**: Automatically updates copyright year

### Admin Dashboard
- **Secure Authentication**: JWT-based token authentication
- **Dashboard Overview**: Stats for contacts, testimonials, and blog posts
- **Contact Messages Management**:
  - View all contact form submissions
  - Delete contact messages
  - Reply to messages via email
  - Track reply status
  
- **Testimonials Management**:
  - Approve/unapprove testimonials
  - Reply to testimonials
  - View testimonial ratings
  
- **Blog Management**:
  - Create new blog posts with featured images
  - Edit and delete posts
  - Support for draft and published statuses
  - Image upload with validation
  - Automatic slug generation

### Technical Features
- **Email Notifications**: Automated email replies via Gmail SMTP
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all forms
- **Security Headers**: Helmet.js for secure HTTP headers
- **Database**: MySQL with automatic table initialization
- **File Uploads**: Secure image upload with validation
- **Error Handling**: Comprehensive error handling and logging

## 🛠 Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MySQL2**: Database driver with promise support
- **JWT (jsonwebtoken)**: Authentication tokens
- **Bcryptjs**: Password hashing
- **Nodemailer**: Email sending
- **Multer**: File upload middleware
- **Helmet**: Security headers
- **Express Rate Limit**: Request rate limiting
- **Cookie Parser**: Cookie handling
- **Dotenv**: Environment variable management

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables
- **JavaScript (Vanilla)**: No framework dependencies
- **Fetch API**: Asynchronous HTTP requests
- **LocalStorage**: Client-side token storage

### Development
- **NPM**: Package management
- **Postman**: API testing (recommended)

## 📁 Project Structure

```
spectrum-legal/
├── index.js                 # Main server file
├── db.js                    # Database configuration and initialization
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not included in repo)
├── .gitignore               # Git ignore rules
├── public/                  # Static files served to clients
│   ├── index.html          # Home page
│   ├── blog.html           # Blog listing page
│   ├── blog-detail.html    # Individual blog article page
│   ├── contact.html        # Contact form page
│   ├── login.html          # Admin login page
│   ├── dashboard.html      # Admin dashboard
│   ├── css/
│   │   └── styles.css      # Additional styles
├── uploads/                # User-uploaded files
│   ├── blog/               # Blog post images
│   ├── blogs/              # Additional blog images
│   └── img/                # Other images
└── README.md              # This file
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- NPM (v6 or higher)
- MySQL Server (v5.7 or higher)
- Gmail account (for email functionality)

### Step 1: Clone or Download the Project
```bash
cd spectrum-legal
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=spectrum_legal

# JWT Secret (use a strong random string)
JWT_SECRET=your_very_long_and_secure_random_string_here

# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### Step 4: Create MySQL Database
```sql
CREATE DATABASE IF NOT EXISTS spectrum_legal;
```

The application will automatically create all required tables on first run.

### Step 5: Set Up Gmail App Password
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Use this password in the `EMAIL_PASS` environment variable

## ⚙️ Configuration

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port number | 3000 |
| NODE_ENV | Environment mode | development, production |
| DB_HOST | MySQL server host | localhost |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | securepass123 |
| DB_NAME | Database name | spectrum_legal |
| JWT_SECRET | Secret key for JWT tokens | use-a-very-long-random-string |
| EMAIL_USER | Gmail address for sending emails | legal@example.com |
| EMAIL_PASS | Gmail app-specific password | abc defg hijk lmno |

### Default Admin Credentials
- **Email**: admin@spectrumlegals.com
- **Password**: Admin@123!!

⚠️ **Change these credentials immediately after first login!**

## 🏃 Running the Application

### Development Mode
```bash
npm start
```

The application will start on `http://localhost:3000`

### Server Initialization
On first run, the server will:
1. Create the MySQL database
2. Create all required tables (users, blogs, contacts, testimonials)
3. Insert default admin user
4. Display: "Server running on port 3000"

## 📡 API Endpoints

### Public Endpoints (No Authentication Required)

#### Blog Endpoints
- `GET /api/blogs` - Get all published blogs with optional limit
  - Query params: `limit`, `status`
  - Example: `/api/blogs?limit=3&status=published`

- `GET /api/blogs/:slug` - Get single blog by slug
  - Example: `/api/blogs/my-legal-insights`

#### Testimonials Endpoints
- `GET /api/testimonials` - Get approved testimonials
  - Query params: `approved` (true/false)
  - Example: `/api/testimonials?approved=false`

- `POST /api/testimonials` - Submit new testimonial
  - Body: `{ name, email, rating (1-5), message }`

#### Contact Endpoints
- `POST /api/contact` - Submit contact form
  - Body: `{ name, email, phone, subject, message }`

### Protected Endpoints (Requires Authentication)

#### Admin Authentication
- `POST /api/admin/login` - Admin login
  - Body: `{ email, password }`
  - Returns: `{ token, message, user }`

- `GET /api/admin/check-auth` - Verify authentication
  - Headers: `Authorization: Bearer <token>`

- `POST /api/admin/logout` - Logout (clears cookie)

#### Contact Management (Admin)
- `GET /api/contacts` - Get all contact submissions
  - Headers: `Authorization: Bearer <token>`

- `DELETE /api/contacts/:id` - Delete contact message
  - Headers: `Authorization: Bearer <token>`

#### Testimonials Management (Admin)
- `GET /api/testimonials` - Get all testimonials (including unapproved)
  - Headers: `Authorization: Bearer <token>`

- `PUT /api/testimonials/:id/approve` - Approve/unapprove testimonial
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ approved: true/false }`

#### Blog Management (Admin)
- `POST /api/blogs` - Create new blog post
  - Headers: `Authorization: Bearer <token>`
  - Form Data: `{ title, content, excerpt, status, image (file) }`

#### Email Endpoint
- `POST /api/send-email` - Send email reply
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ to, subject, message, type (contact/testimonial), recordId }`

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blogs Table
```sql
CREATE TABLE blogs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  image VARCHAR(255),
  status ENUM('draft', 'published') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Contacts Table
```sql
CREATE TABLE contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Testimonials Table
```sql
CREATE TABLE testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📊 Admin Dashboard

### Dashboard Features

**Overview Tab**
- Summary statistics for contacts, testimonials, and blog posts
- Recent contact messages
- Pending testimonials
- Quick access counts

**Contact Messages Tab**
- Table view of all contact submissions
- Columns: Date, Name, Email, Phone, Subject, Message preview, Status
- Actions: Delete, Reply via Email
- Status indicators: Pending/Replied

**Testimonials Tab**
- Table view of all testimonials
- Columns: Date, Name, Email, Rating, Message, Status
- Actions: View, Approve/Unapprove, Reply via Email
- Star ratings display

**Blog Management Tab**
- Table view of all blog posts
- Columns: Date, Title, Status, Excerpt
- Actions: Edit, Delete
- Status indicators: Draft/Published

**New Blog Post Tab**
- Form for creating new blog articles
- Fields: Title, Status, Excerpt, Content, Featured Image
- Drag-and-drop image upload
- Image preview
- WYSIWYG content editor (recommended: integrate TinyMCE or Quill for production)

## 📝 Contact Form

### Contact Form Fields
- **Name** (Required): Full name of the sender
- **Email** (Required): Valid email address
- **Phone** (Optional): Contact phone number
- **Subject** (Optional): Message subject
- **Message** (Required): Message content

### Contact Form Features
- Email validation
- Server-side validation
- WhatsApp integration button
- Email notification to firm
- Admin reply capability

## 📰 Blog System

### Blog Features
- **Create Posts**: Admin can create new blog articles
- **Rich Content**: Support for HTML content with proper formatting
- **Featured Images**: Each post can have a featured image
- **Slug Generation**: Automatic URL slug creation from title
- **Status Management**: Draft and Published statuses
- **Related Articles**: Display related blog posts on detail pages
- **Responsive Display**: Articles adapt to all screen sizes

### Blog File Organization
- Blog images stored in `/uploads/blogs/`
- Unique filenames to prevent conflicts
- Size validation (max 10MB)
- Type validation (JPEG, PNG, GIF, WebP)

## 💬 Testimonials

### Testimonial Features
- **Star Ratings**: 1-5 star rating system
- **Approval Workflow**: Admin approval before display
- **Email Replies**: Admin can reply to testimonials
- **Display**: Approved testimonials shown on homepage
- **Responsive Grid**: Testimonials display in responsive layout

### Testimonial Form Fields
- Name (Required)
- Email (Optional but required for replies)
- Rating (1-5 stars, Required)
- Message (Required)

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password
5. Use this password in `EMAIL_PASS` environment variable

### Email Templates
- Contact reply: "Re: Your inquiry to Spectrum Legal"
- Testimonial reply: "Re: Your testimonial for Spectrum Legal"

### Email Features
- HTML and plain text support
- Automatic line break to HTML conversion
- Error handling and logging
- Rate limiting on email sends

### Testing Email (Optional)
For development, you can use Ethereal Email (fake SMTP):
```bash
# Install test email package
npm install nodemailer-ethereal

# Update email config in index.js
const testAccount = await nodemailer.createTestAccount();
```

## 🎨 Frontend Features

### Responsive Design
- Mobile-first approach
- Breakpoints at 768px (tablet) and 1024px (desktop)
- Flexible grid layouts
- Touch-friendly buttons and links

### Navigation
- Sticky header with smooth scrolling
- Mobile hamburger menu (can be enhanced with Tailwind CSS)
- Quick links to main sections

### Typography
- Primary font: Georgia (serif) for professional look
- Elegant heading hierarchy
- Readable line heights and spacing
- High contrast for accessibility

### Dynamic Elements
- Auto-updating copyright year
- Smooth transitions and hover effects
- Loading states for async operations
- Error messages for user feedback

### Accessibility
- Semantic HTML structure
- Alt text for images
- ARIA labels on interactive elements
- Keyboard navigation support

## 🚀 Deployment

### Deployment Checklist
- [ ] Update `NODE_ENV` to `production`
- [ ] Use strong `JWT_SECRET` (minimum 32 characters)
- [ ] Update `DB_HOST` to production database server
- [ ] Disable default admin password
- [ ] Configure email with production Gmail account
- [ ] Set secure cookie flags
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up database backups
- [ ] Configure firewall rules

### Recommended Hosting Platforms
- **Heroku**: Easy deployment with Procfile
- **AWS EC2**: Full control, scalability
- **DigitalOcean**: Simple VPS hosting
- **Railway**: Modern Node.js hosting
- **Render**: Serverless and container deployment

### Production Environment Variables
```env
PORT=3000
NODE_ENV=production
DB_HOST=prod.database.server
DB_USER=prod_user
DB_PASSWORD=secure_production_password
DB_NAME=spectrum_legal_prod
JWT_SECRET=use_a_very_long_and_secure_random_string_minimum_32_chars
EMAIL_USER=notifications@spectrumlegals.com
EMAIL_PASS=app_specific_password
```

## 🔒 Security

### Implemented Security Features
1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: Bcryptjs for password security
3. **HTTP Headers**: Helmet.js for security headers
4. **Rate Limiting**: Express rate limit on API endpoints
5. **CORS**: Controlled cross-origin requests
6. **Input Validation**: Server-side validation on all inputs
7. **File Upload Validation**: Type and size restrictions
8. **Error Handling**: No sensitive info in error messages

### Security Best Practices
- Always use HTTPS in production
- Keep dependencies updated: `npm audit fix`
- Use strong JWT secret (min 32 characters)
- Change default admin credentials
- Regular database backups
- Monitor error logs
- Implement Web Application Firewall (WAF)
- Use environment variables for all secrets
- Enable database authentication

### Password Requirements
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, special characters
- Not stored in plain text (bcryptjs hash)

## 🐛 Troubleshooting

### Common Issues

#### Server won't start
```
Error: Cannot find module...
```
**Solution**: Run `npm install` to install dependencies

#### Database connection error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: 
1. Ensure MySQL is running
2. Check DB_HOST, DB_USER, DB_PASSWORD in .env
3. Verify database name

#### Email not sending
```
Error: Invalid login: 535-5.7.8 Username and password not accepted
```
**Solution**:
1. Generate App Password (not regular Gmail password)
2. Enable 2-Factor Authentication
3. Check EMAIL_USER and EMAIL_PASS in .env
4. Verify less secure apps are disabled

#### Blog image not uploading
```
Error: ENOENT: no such file or directory
```
**Solution**:
1. Create `/uploads/blogs/` directory
2. Ensure directory permissions are correct
3. Verify file size < 10MB
4. Check file type is image

#### Admin login fails
```
Error: Invalid credentials
```
**Solution**:
1. Use default credentials: admin@spectrumlegals.com / Admin@123!!
2. Check .env JWT_SECRET hasn't changed
3. Clear browser localStorage and try again

#### Delete contact returns 404
```
DELETE http://localhost:3000/api/contacts/2 404 (Not Found)
```
**Solution**: Restart the server after adding new endpoints

## 📚 API Testing

### Using Postman

1. **Create login request**:
   - POST: `http://localhost:3000/api/admin/login`
   - Body (JSON): 
   ```json
   {
     "email": "admin@spectrumlegals.com",
     "password": "Admin@123!!"
   }
   ```

2. **Set authorization**:
   - Copy token from response
   - In Authorization tab, select "Bearer Token"
   - Paste token in the token field

3. **Test protected endpoints** with token

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@spectrumlegals.com","password":"Admin@123!!"}'

# Get contacts (with token)
curl -X GET http://localhost:3000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📄 License

This project is the property of Spectrum Legal. All rights reserved.

Unauthorized copying, modification, or distribution is prohibited.

---

## 📞 Support & Contact

For technical support or inquiries:
- **Email**: oyinlola.tech@icloud.com
- **Phone**: +234 913 3519 489
- **Website**: https://oyinlola.site

---

## 📝 Version History

**v1.0.0** (January 2026)
- Initial release
- Blog system implementation
- Admin dashboard
- Contact and testimonial management
- Email notification system
- Dynamic copyright year

---

**Last Updated**: January 12, 2026
**Maintained By**: Development Team
