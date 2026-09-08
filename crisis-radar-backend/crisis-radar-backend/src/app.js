const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok' })
);

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) =>
  res.status(404).json({ error: 'Not found.' })
);

app.use(errorHandler);

module.exports = app;