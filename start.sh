#!/bin/bash

echo "Starting EFR internal server..."

# start EFR in background
bash run.sh &

# wait for EFR to fully boot
sleep 6

echo "Starting proxy server..."

node proxy.js
