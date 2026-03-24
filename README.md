# Legal Spectrum - Barristers and Solicitors

A modern, professional website and admin dashboard for Legal Spectrum, a law firm providing partner-led legal services across Ondo State, Nigeria.

## Table of Contents
- Features
- Technology Stack
- Project Structure
- Installation
- Configuration
- Running the Application
- API Endpoints
- Email Templates
- Deployment
- Security
- Troubleshooting

## Features

### Public Website
- Responsive design with consistent branding
- Home, About, Practice Areas, Blog, FAQ, Contact, Privacy, and Terms pages
- Blog listing and detail pages with related content
- WhatsApp integration for client inquiries
- Shared header/footer/CTA partials for maintainability

### Admin Dashboard
- JWT-based authentication
- Contact, testimonial, and blog management
- Email replies to contacts and testimonials
- Blog uploads with featured images

### Technical Highlights
- Structured Express server (routes, middleware, utils)
- Email template inlining during send
- Rate limiting and security headers
- CSS linting and formatting

## Technology Stack

### Backend
- Node.js
- Express
- MySQL2
- JWT (jsonwebtoken)
- Bcryptjs
- Nodemailer
- Multer
- Helmet
- Express Rate Limit
- Cookie Parser
- Dotenv

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Development
- Nodemon
- BrowserSync
- Stylelint

## Project Structure

```
Telenter-Chamber/
├── index.js
├── db.js
├── middleware/
│   ├── auth.js
│   ├── rateLimiter.js
│   └── upload.js
├── routes/
│   ├── api.js
│   └── pages.js
├── utils/
│   └── email.js
├── public/
│   ├── partials/
│   │   ├── header.html
│   │   ├── header-admin.html
│   │   ├── footer.html
│   │   └── cta.html
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── blog.html
│   ├── blog-detail.html
│   ├── about.html
│   ├── practice.html
│   ├── faq.html
│   ├── contact.html
│   ├── privacy.html
│   ├── terms.html
│   ├── login.html
│   ├── dashboard.html
│   ├── forgot-password.html
│   └── unsubscribe.html
├── uploads/
│   ├── blog/
│   ├── blogs/
│   └── img/
├── package.json
├── .stylelintrc.json
└── README.md
```

## Installation

### Prerequisites
- Node.js 14+
- MySQL 5.7+

### Install Dependencies
```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=spectrum_legal

JWT_SECRET=your_very_long_and_secure_random_string_here

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM_NAME=Legal Spectrum
```

## Running the Application

### Development
```bash
npm run dev
```
This runs Nodemon and BrowserSync for live reload.

### Production
```bash
node index.js
```

## API Endpoints

### Public
- `GET /api/blogs`
- `GET /api/blogs/:slug`
- `GET /api/testimonials`
- `POST /api/testimonials`
- `POST /api/contact`
- `POST /api/subscribe`
- `GET /api/unsubscribe`

### Admin
- `POST /api/admin/login`
- `GET /api/admin/check-auth`
- `POST /api/admin/logout`
- `POST /api/admin/forgot-password`
- `POST /api/admin/verify-otp`
- `POST /api/admin/reset-password`
- `POST /api/admin/resend-otp`
- `POST /api/blogs` (auth)
- `DELETE /api/blogs/:id` (auth)
- `GET /api/contacts` (auth)
- `DELETE /api/contacts/:id` (auth)
- `PUT /api/testimonials/:id/approve` (auth)
- `POST /api/send-email` (auth)

## Email Templates
- Stored in `public/*.html` with CSS in `public/css/emails/`
- CSS is automatically inlined during send using `utils/email.js`

## Deployment
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure HTTPS and secure cookie flags

## Security
- Helmet headers
- Rate limiting on all `/api` routes
- Server-side validation of input

## Troubleshooting

- Ensure MySQL is running and credentials are correct.
- Ensure `/uploads/blogs/` exists for image uploads.
- For email issues, verify Gmail App Passwords and `EMAIL_*` env vars.

---

Last Updated: March 24, 2026  
Maintained By: Oluwayemi Oyinlola Micahael
