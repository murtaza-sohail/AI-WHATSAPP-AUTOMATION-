const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { startBot, getStatus, getQR } = require('./bot');
const logger = require('./logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Make io globally accessible for the bot
global.io = io;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    logger.info('Dashboard client connected');
    socket.emit('status', getStatus());
    const qr = getQR();
    if (qr) socket.emit('qr', qr);

    socket.on('disconnect', () => {
        logger.info('Dashboard client disconnected');
    });
});

const PORT = process.env.PORT || 3000;

// Start bot and server concurrently
logger.info('Initializing Bot and Dashboard concurrently...');
startBot();

server.listen(PORT, () => {
    logger.info(`Dashboard running at http://localhost:${PORT}`);
    logger.info('Ultra-fast startup sequence initiated.');
});
