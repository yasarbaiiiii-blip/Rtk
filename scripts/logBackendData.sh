#!/bin/bash

# ============================================
# GNSS Backend Logger - Unix/Linux/Mac Launcher
# ============================================
# Usage: chmod +x logBackendData.sh && ./logBackendData.sh

set -e

echo ""
echo "================================================"
echo "🚀 GNSS Backend Logger"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "📝 Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if npm dependencies are installed
if [ ! -d "$SCRIPT_DIR/../node_modules/ws" ]; then
    echo "📦 Installing dependencies..."
    cd "$SCRIPT_DIR/.."
    npm install ws node-fetch
fi

# Run the logging script
echo "🔗 Starting backend logger..."
echo ""

node "$SCRIPT_DIR/logBackendData.js"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Logger completed successfully!"
else
    echo "❌ Logger exited with error code: $EXIT_CODE"
    exit $EXIT_CODE
fi
