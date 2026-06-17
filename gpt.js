const { OpenAI } = require('openai');
const fs = require('fs');
const config = require('./config');
const logger = require('./logger');

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.openai.apiKey,
});

/**
 * Sends text to ChatGPT and returns the response with full context history.
 * @param {string} text - Incoming WhatsApp message
 * @param {string} chatName - Name of the sender
 * @param {Array} history - Array of recent message objects
 * @returns {Promise<string>} - ChatGPT response
 */
async function getGPTResponse(text, chatName = 'User', history = []) {
    try {
        logger.info(`Sending message to ChatGPT from ${chatName} with context history...`);

        const messages = [
            {
                role: 'system',
                content: `Bhai tum ek bohot samajhdar aur helpful WhatsApp assistant ho. 
                - User ki baat ko achay se samajh kar sahi aur accurate (durust) jawab do.
                - Fazool ya ghalat baatein mat karo.
                - Agar user kuch pooche toh detail se samjhao agar zaroorat ho, lekin short aur to-the-point rakho.
                - Hamesha Roman Urdu use karo.
                - Pichli baaton (history) ka dhyan rakho taake sahi context mein jawab de sako.`
            }
        ];

        // Add history to the messages array, formatted for OpenAI (last 7 messages only)
        const recentHistory = history.slice(-7);
        recentHistory.forEach(h => {
            const role = h.role === 'assistant' ? 'assistant' : 'user';
            const content = role === 'assistant' ? h.content : `Sender: ${h.name}\nMessage: ${h.content}`;
            messages.push({ role, content });
        });

        const response = await openai.chat.completions.create({
            model: config.openai.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 150,
        });

        const reply = response.choices[0].message.content.trim();
        logger.info(`Received response from ChatGPT: "${reply.substring(0, 50)}..."`);
        return reply;
    } catch (error) {
        logger.error('Error calling ChatGPT API:', error);
        if (error.status === 401) {
            return "Bhai, OpenAI API key check karo, error 401 aa raha hai.";
        }
        return "Sorry, I'm having trouble thinking right now. Please try again later.";
    }
}

/**
 * Generates human-like voice response from text.
 * @param {string} text - The text to convert to speech
 * @param {string} outputPath - Path to save the audio file
 * @returns {Promise<string>} - Path to the generated audio file
 */
async function getGPTVoiceResponse(text, outputPath) {
    try {
        logger.info(`Generating voice response for: "${text.substring(0, 50)}..."`);

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // "alloy", "echo", "fable", "onyx", "nova", "shimmer"
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(outputPath, buffer);

        logger.info(`Voice response saved to ${outputPath}`);
        return outputPath;
    } catch (error) {
        logger.error('Error generating voice response:', error);
        throw error;
    }
}

module.exports = { getGPTResponse, getGPTVoiceResponse };
