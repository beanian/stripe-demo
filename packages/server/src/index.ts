import './env.js'; // Load .env from monorepo root — must be first import
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import webhookRouter from './routes/webhook.js';
import quoteRouter from './routes/quote.js';
import checkoutRouter from './routes/checkout.js';
import paymentIntentRouter from './routes/payment-intent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4242;
const isProduction = process.env.NODE_ENV === 'production';

// Webhook needs raw body — mount BEFORE express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// JSON parsing for all other routes
app.use(express.json());

// CORS — only needed in dev (production serves client from same origin)
if (!isProduction) {
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
}

// Mount API routes
app.use('/api', quoteRouter);
app.use('/api', checkoutRouter);
app.use('/api', paymentIntentRouter);

// In production, serve the built client files
if (isProduction) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
