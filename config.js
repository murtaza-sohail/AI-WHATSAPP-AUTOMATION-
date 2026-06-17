require('dotenv').config();

const config = {
    openai: {
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.GPT_MODEL || 'gpt-4o',
    },
    bot: {
        pollInterval: parseInt(process.env.POLL_INTERVAL, 10) || 1000,
        sessionPath: process.env.SESSION_PATH || './whatsapp_session',
        dedupeSize: parseInt(process.env.DEDUPE_SIZE, 10) || 100,
        blacklist: ['923337675003@c.us', '923264524644@c.us'] // Updated by user request
    },
    voice: {
        enabled: true,
        outputDir: './logs/voice',
    }
};

module.exports = config;
