#!/bin/bash

echo "============================================"
echo "  Campus Club Collaboration Portal - Setup  "
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Install from https://nodejs.org (v18+)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install
echo ""

# Install client dependencies  
echo "📦 Installing client dependencies..."
cd ../client && npm install
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
cd .. && npm install
echo ""

echo "============================================"
echo "  ✅ Setup Complete!                        "
echo "============================================"
echo ""
echo "  To start the app, run:"
echo ""
echo "    npm run dev"
echo ""
echo "  Then open http://localhost:5173"
echo "  (Backend runs on http://localhost:5000)"
echo "============================================"
