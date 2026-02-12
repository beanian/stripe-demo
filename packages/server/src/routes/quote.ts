import { Router } from 'express';
import { getQuote } from '../services/quote.js';

const router = Router();

router.get('/quote/:id', (req, res) => {
  const quote = getQuote(req.params.id);
  res.json(quote);
});

export default router;
