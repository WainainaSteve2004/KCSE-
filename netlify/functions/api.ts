import express from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../src/server/api';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Mount the API router at the root so redirects work correctly
app.use('/', apiRouter);

export const handler = serverless(app);
