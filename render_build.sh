#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Installing backend requirements..."
pip install -r backend/requirements.txt
