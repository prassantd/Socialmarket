require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const connectDB = require('./config/db');

connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true } });

// Socket.io
io.on('connection', (socket) => {
  socket.on('user:online', (userId) => socket.join(`user:${userId}`));
  socket.on('conv:join',   (id)     => socket.join(`conv:${id}`));
  socket.on('msg:send',    (data)   => io.to(`conv:${data.conversationId}`).emit('msg:new', data));
  socket.on('msg:typing',  (data)   => socket.to(`conv:${data.conversationId}`).emit('msg:typing', data));
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Increase payload limit to handle base64 images (each image ~6MB as base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// All API routes
app.use('/api', require('./routes/index'));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀  Backend running at  http://localhost:${PORT}`);
  console.log(`🖼️   Images stored as base64 in MongoDB`);
  console.log(`📡  Socket.io ready\n`);
});
