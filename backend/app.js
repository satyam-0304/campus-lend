'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const equipmentRoutes = require('./routes/equipmentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS ───────────────────────────────────────────────────────
app.use(cors());


// ── Body parser ────────────────────────────────────────────────
app.use(express.json());

// ── Request Logger ─────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - body:`, req.body);
  next();
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/equipment', equipmentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/profiles', profileRoutes);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CampusLend backend running on http://localhost:${PORT}`);
});
