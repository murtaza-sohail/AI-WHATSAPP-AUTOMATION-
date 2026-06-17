# Premium WhatsApp ChatGPT Automation

A robust, self-hosted WhatsApp automation tool optimized for both PC and Android (Termux). Features a premium web dashboard for easy management.

## 🚀 Key Features
- **Premium Dashboard**: Real-time status and QR code scanning via a modern web UI.
- **Android Optimized**: Runs natively in Termux using system Chromium.
- **AI-Powered**: Intelligent, human-like responses via OpenRouter/ChatGPT.
- **24/7 Stability**: Automatic reconnection and session persistence.
- **Device Friendly**: Use your phone or PC as the bot host.

## 🧠 How It Works

### 1. System Architecture
The bot is built using a modern Node.js stack:
- **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)**: A powerful library that controls a headless browser (Puppeteer) to interact with WhatsApp Web.
- **Express & Socket.io**: Powers the real-time web dashboard where you can monitor status and scan the QR code.
- **OpenRouter/ChatGPT**: The "brain" of the bot, providing intelligent, context-aware responses.

### 2. Message Flow
1. **Detection**: The bot constantly monitors your WhatsApp for new incoming messages.
2. **Context Retrieval**: When a message arrives, the bot fetches the last 10 messages from that specific chat to understand the conversation history.
3. **AI Analysis**: The message and its history are sent to the AI model (configured in `.env`) with a specialized system prompt designed for professional, authentic interaction.
4. **Automated Reply**: The AI-generated response is sent back to the user instantly, making the interaction feel seamless and human-like.

### 3. Session Persistence
Using the `LocalAuth` strategy, the bot saves your login session locally. This means you only need to scan the QR code once; the bot will stay logged in even after restarts.

## 🛠️ Installation

### On PC (Linux/Windows/Mac)
1. **Clone** this repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure**:
   - Add your `OPENROUTER_API_KEY` to the `.env` file.
4. **Run**:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` in your browser to scan the QR code.

### On Android (Termux)
1. Install **Termux** (from F-Droid).
2. Open Termux and run:
   ```bash
   pkg install git -y
   git clone <your-repo-url>
   cd <repo-folder>
   ./termux-setup.sh
   node server.js
   ```
3. Open your mobile browser at `http://localhost:3000`.

## ⚙️ Configuration (.env)
- `OPENROUTER_API_KEY`: Your API key for AI responses.
- `GPT_MODEL`: e.g., `gpt-4o` or `meta-llama/llama-3.1-8b-instruct`.
- `POLL_INTERVAL`: Frequency of message checks (ms).

## 📊 Dashboard
The dashboard provides:
- Live status indicators (Initializing, Connected, Processing).
- Real-time activity logs.
- Dynamic QR code for easy linking.

---
*Disclaimer: This tool is for educational purposes. Please use responsibly and adhere to WhatsApp's Terms of Service.*
