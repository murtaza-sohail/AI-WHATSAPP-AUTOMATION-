#!/bin/bash

echo "🚀 Starting WhatsApp Automation Android Setup..."

# Update packages
pkg update && pkg upgrade -y

# Install Node.js and Chromium
pkg install -y nodejs-lts chromium git

# Install build essential for some native modules
pkg install -y build-essential

# Fix for Puppeteer in Termux
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing project dependencies..."
    npm install
fi

echo "✅ Setup complete!"
echo "👉 1. Update the .env file with your OPENROUTER_API_KEY."
echo "👉 2. To start the bot, run: node server.js"
echo "🌐 3. Then open http://localhost:3000 in your browser to scan the QR code."
