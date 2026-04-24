import express, { Router } from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../src/server/api.ts';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Robust path handling for Netlify
app.use((req, res, next) => {
  const prefix = '/.netlify/functions/api';
  if (req.url.startsWith(prefix)) {
    req.url = req.url.slice(prefix.length) || '/';
  } else if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(apiRouter);

export const handler = serverless(app);
