module.exports = {
  apps: [
    {
      name: 'whatsapp-bot',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Ultra-fast startup optimization
      node_args: '--max-old-space-size=1024'
    }
  ]
};
