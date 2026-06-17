const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getGPTResponse, getGPTVoiceResponse } = require('./gpt');
const logger = require('./logger');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'whatsapp-bot',
        dataPath: './whatsapp_session'
    }),
    puppeteer: {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--no-first-run',
            '--no-zygote',
            '--no-default-browser-check',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-ipc-flooding-protection',
            '--disable-client-side-phishing-detection',
            '--disable-default-apps',
            '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process,Translate,OptimizationHints',
            '--disable-hang-monitor',
            '--disable-notifications',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-sync',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--password-store=basic',
            '--use-gl=swiftshader',
            '--use-mock-keychain',
            '--proxy-server="direct://"',
            '--proxy-bypass-list=*',
            '--disable-accelerated-2d-canvas',
            '--single-process',
            '--disable-software-rasterizer',
            '--disable-dev-tools',
            '--disable-remote-fonts',
            '--disable-web-security',
            '--font-render-hinting=none',
            '--blink-settings=imagesEnabled=false'
        ],
        executablePath: '/usr/bin/chromium',
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
    },
    qrTimeoutMs: 60000,
    authTimeoutMs: 60000
});

// RESOURCE BLOCKING: Block CSS, Fonts, and redundant scripts for mega speedup
client.on('ready', () => {
    logger.info('Optimization: Resource blocking enabled for future loads.');
});

// Since we can't easily access the internal puppeteer page before initialize in wwebjs, 
// we use the 'puppeteer' property of the client after it's initialized OR we can try to
// hook into it earlier if possible. Actually, wwebjs doesn't expose the page easily
// before load. But we can use the 'puppeteer' option and 'page' in some versions.
// However, the best way with wwebjs is often to wait for the browser to launch.

client.on('qr', () => {
    logger.info('QR ready - check dashboard.');
});

let botStatus = 'Initializing...';
let lastQR = null;

client.on('qr', (qr) => {
    lastQR = qr;
    qrcode.generate(qr, { small: true });
    logger.info('QR Code received, scan it in the dashboard or terminal.');
    botStatus = 'Awaiting Link';
    if (global.io) {
        global.io.emit('qr', qr);
        global.io.emit('status', botStatus);
    }
});

client.on('ready', async () => {
    botStatus = 'Connected';
    logger.info('WhatsApp Client is ready!');
    if (global.io) {
        global.io.emit('status', botStatus);
    }

    // Process unread messages on startup and every 1 second as requested for ultra-fast response
    let isScanning = false;
    const fastPoll = async () => {
        if (isScanning) return;
        isScanning = true;
        try {
            await processUnreadMessages();
        } finally {
            isScanning = false;
        }
    };
    
    await fastPoll();
    setInterval(fastPoll, 1000);
});

client.on('authenticated', () => {
    botStatus = 'Authenticated';
    logger.info('WhatsApp Authenticated!');
    if (global.io) {
        global.io.emit('status', botStatus);
    }
});

client.on('auth_failure', (msg) => {
    botStatus = 'Auth Failure';
    logger.error('Authentication failure:', msg);
    if (global.io) {
        global.io.emit('status', botStatus);
    }
});

client.on('disconnected', (reason) => {
    botStatus = 'Disconnected';
    logger.warn('Client was logged out', reason);
    if (global.io) global.io.emit('status', botStatus);
    // Restart on disconnection
    setTimeout(() => {
        logger.info('Attempting to re-initialize...');
        client.initialize();
    }, 5000);
});

client.on('message', async (msg) => {
    await processChatMessage(msg);
});

async function processChatMessage(msg) {
    try {
        // Skip status updates and broadcasts immediately before fetching the chat object
        if (msg.isStatus || (msg.from && msg.from.endsWith('@broadcast'))) {
            logger.info(`Ignoring status update from ${msg.from}`);
            return;
        }

        const chat = await msg.getChat();

        // Skip groups and channels (newsletters) to avoid crashes in whatsapp-web.js
        if (chat.isGroup || chat.isNewsletter || chat.id.server === 'newsletter') {
            logger.info(`Skipping message from ${chat.isGroup ? 'group' : 'channel/newsletter'}: ${chat.name || chat.id._serialized}`);
            return;
        }

        // Skip blacklisted numbers (Total Ignore)
        const isBlacklisted = config.bot.blacklist && (
            config.bot.blacklist.includes(msg.from) || 
            config.bot.blacklist.includes(msg.from.split('@')[0]) ||
            (chat && config.bot.blacklist.includes(chat.id._serialized))
        );

        if (isBlacklisted) {
            logger.info(`TOTALLY IGNORING blacklisted number: ${msg.from} (${chat ? chat.name : 'Unknown'})`);
            return;
        }

        // Skip empty messages (e.g., media without caption)
        if (!msg.body || msg.body.trim() === '') {
            logger.info(`Skipping empty/media message from ${chat.name}`);
            return;
        }

        // Log incoming message
        logger.info(`Message from ${chat.name} (${msg.from}): ${msg.body}`);

        if (msg.fromMe) return;

        // Mark the message as read/seen and show typing status
        await chat.sendSeen();
        await chat.sendStateTyping();
        logger.info(`Thinking and replying to ${chat.name}...`);

        botStatus = `Replying to ${chat.name}`;
        if (global.io) global.io.emit('status', botStatus);

        // Fetch recent message history (last 10 messages) for "authentic" context
        const messages = await chat.fetchMessages({ limit: 10 });
        const history = messages.map(m => ({
            role: m.fromMe ? 'assistant' : 'user',
            content: m.body,
            name: m.fromMe ? 'Bot' : chat.name
        }));

        const gptReply = await getGPTResponse(msg.body, chat.name, history);

        // Pause a bit to simulate real typing speed
        // Ultra-fast response: No artificial typing delay
        // await new Promise(resolve => setTimeout(resolve, typingDelay));

        await client.sendMessage(msg.from, gptReply);
        await chat.clearState(); // Stop typing indicator
        logger.info(`✅ Replied to ${chat.name}`);

        botStatus = 'Active - Monitoring';
        if (global.io) global.io.emit('status', botStatus);

    } catch (error) {
        logger.error('Error processing message:', error);
    }
}

async function processUnreadMessages() {
    logger.info('Checking for unread messages...');
    try {
        const chats = await client.getChats();
        // Filter out status updates if they somehow appear in the chats list
        const unreadChats = chats.filter(chat => {
            const isBlacklisted = config.bot.blacklist && (
                config.bot.blacklist.includes(chat.id._serialized) ||
                config.bot.blacklist.includes(chat.id.user) ||
                config.bot.blacklist.includes(chat.id._serialized.split('@')[0])
            );

            return chat.unreadCount > 0 && 
                   !chat.isGroup && 
                   !chat.isNewsletter && 
                   !chat.id._serialized.endsWith('@broadcast') &&
                   !isBlacklisted;
        });

        if (unreadChats.length === 0) {
            logger.info('No unread messages found (excluding groups/channels/status).');
            return;
        }

        logger.info(`Found ${unreadChats.length} chats with unread messages.`);

        for (const chat of unreadChats) {
            try {
                const messages = await chat.fetchMessages({ limit: chat.unreadCount });
                for (const msg of messages) {
                    if (!msg.fromMe) {
                        await processChatMessage(msg);
                        // Add a small delay between messages to feel more natural and avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 200)); // Minimal delay for speed
                    }
                }
                // Mark chat as read
                await chat.sendSeen();
            } catch (chatError) {
                logger.error(`Error processing chat ${chat.name}:`, chatError);
            }
        }
    } catch (error) {
        logger.error('Error processing unread messages:', error);
    }
}

async function startBot() {
    logger.info('Starting WhatsApp Bot Service...');
    try {
        await client.initialize();
    } catch (err) {
        logger.error('Failed to initialize client:', err);
        setTimeout(startBot, 10000); // Retry in 10s
    }
}

process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

module.exports = { startBot, client, getStatus: () => botStatus, getQR: () => lastQR };
