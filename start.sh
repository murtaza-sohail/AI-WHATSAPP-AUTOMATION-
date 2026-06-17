#!/bin/bash
while true
do
  echo "Starting WhatsApp Bot..."
  node server.js
  echo "Bot crashed or stopped. Restarting in 5 seconds..."
  sleep 5
done
