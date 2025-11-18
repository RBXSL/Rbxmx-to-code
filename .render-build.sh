#!/usr/bin/env bash

# Install system dependencies needed for aiohttp
apt-get update
apt-get install -y build-essential python3-dev libssl-dev libffi-dev

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
