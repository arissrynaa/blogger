import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { validate } from './middleware/validate.js';
import { searchSchema } from './schemas/index.js';
import authRoutes from './routes/auth.routes.js';
import articleRoutes from './routes/article.routes.js';
import categoryRoutes from './routes/category.routes.js';
import tagRoutes from './routes/tag.routes.js';
import seoRoutes from './routes/seo.routes.js';
import * as articleController from './controllers/article.controller.js';
import * as seoController from './controllers/seo.controller.js';

const app = express();

// Railway terminates TLS at its proxy and forwards the client IP header.
// Trusting the first proxy keeps rate limiting accurate in production.
app.set('trust proxy', 1);

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);

// C5: GET /api/search?q=... (contract + frontend)
app.get('/api/search', validate(searchSchema, 'query'), articleController.search);

// SEO
app.use('/api', seoRoutes);

// Q2: Serve robots.txt at root for search engine crawlers
app.get('/robots.txt', seoController.robotsTxt);

// Error handler (must be last)
app.use(errorHandler);

export default app;
