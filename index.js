const express = require('express');
const path = require('path');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { pool, initDatabase } = require('./db');
const { authenticateToken } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');
const { upload } = require('./middleware/upload');
const email = require('./utils/email');
const { createPagesRouter } = require('./routes/pages');
const { createApiRouter } = require('./routes/api');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const forceHttps = process.env.FORCE_HTTPS === 'true';
const PORT = process.env.PORT || 3000;
const getSiteUrl = (req) =>
  process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
const publicDir = path.join(__dirname, 'public');
const isApiRequest = (req) => req.originalUrl.startsWith('/api');

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: forceHttps
    ? { maxAge: 15552000, includeSubDomains: true, preload: true }
    : false
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(hpp());

if (forceHttps) {
  app.use((req, res, next) => {
    if (req.secure) return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

app.get('/robots.txt', (req, res) => {
  const baseUrl = getSiteUrl(req).replace(/\/$/, '');
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\n\nHost: ${baseUrl}\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/rss.xml', async (req, res) => {
  try {
    const baseUrl = getSiteUrl(req).replace(/\/$/, '');
    const [blogs] = await pool.query(
      'SELECT title, slug, excerpt, content, created_at, updated_at FROM blogs WHERE status = "published" ORDER BY created_at DESC'
    );

    const items = blogs
      .map((blog) => {
        const link = `${baseUrl}/blog/${blog.slug}`;
        const description = (blog.excerpt || blog.content || '')
          .replace(/<[^>]+>/g, '')
          .substring(0, 300);
        const pubDate = new Date(blog.updated_at || blog.created_at).toUTCString();
        return `
      <item>
        <title><![CDATA[${blog.title}]]></title>
        <link>${link}</link>
        <guid>${link}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${description}]]></description>
      </item>`;
      })
      .join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Legal Spectrum Insights</title>
    <link>${baseUrl}/blog</link>
    <description>Latest legal insights and updates from Legal Spectrum.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

    res.type('application/rss+xml');
    res.send(rss);
  } catch (error) {
    res.status(500).send('Unable to generate RSS feed.');
  }
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getSiteUrl(req).replace(/\/$/, '');
    const staticPaths = [
      '/',
      '/blog',
      '/contact',
      '/about',
      '/practice',
      '/faq',
      '/privacy',
      '/terms'
    ];

    const [blogs] = await pool.query(
      'SELECT slug, updated_at, created_at FROM blogs WHERE status = "published" ORDER BY created_at DESC'
    );

    const urls = [
      ...staticPaths.map((path) => ({
        loc: `${baseUrl}${path}`,
        lastmod: new Date().toISOString().split('T')[0]
      })),
      ...blogs.map((blog) => ({
        loc: `${baseUrl}/blog/${blog.slug}`,
        lastmod: new Date(blog.updated_at || blog.created_at).toISOString().split('T')[0]
      }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (url) =>
            `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n  </url>`
        )
        .join('\n') +
      `\n</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Unable to generate sitemap.');
  }
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Serve branded favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', 'img', 'legal-specturm.svg'));
});

app.use(
  '/',
  createPagesRouter({
    baseDir: __dirname,
    authenticateToken
  })
);

app.use(
  '/api',
  apiLimiter,
  createApiRouter({
    pool,
    upload,
    authenticateToken,
    email,
    baseDir: __dirname
  })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (isApiRequest(req)) {
    return res.status(500).json({ error: 'Something went wrong!' });
  }
  return res.status(500).sendFile(path.join(publicDir, '500.html'));
});

app.use((req, res) => {
  if (isApiRequest(req)) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(404).sendFile(path.join(publicDir, '404.html'));
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
