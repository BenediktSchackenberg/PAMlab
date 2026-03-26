require('dotenv').config();
const express = require('express');
const { authMiddleware } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Auth (no token needed)
app.use('/api/ad/auth', require('./routes/auth'));

// Protected routes
app.use('/api/ad/users', authMiddleware, require('./routes/users'));
app.use('/api/ad/groups', authMiddleware, require('./routes/groups'));
app.use('/api/ad/ous', authMiddleware, require('./routes/ous'));
app.use('/api/ad/computers', authMiddleware, require('./routes/computers'));
app.use('/api/ad/domain', authMiddleware, require('./routes/domain'));
app.use('/api/ad/bulk', authMiddleware, require('./routes/bulk'));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ad-mock-api', domain: 'corp.local' }));

const PORT = process.env.PORT || 8445;
app.listen(PORT, () => console.log(`AD Mock API running on port ${PORT} (corp.local)`));
