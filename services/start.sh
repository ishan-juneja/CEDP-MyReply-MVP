#!/bin/bash

# Legal Document Processing Services Startup Script

echo "🚀 Starting Legal Document Processing Services..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Start the FastAPI server
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📊 Available endpoints:"
echo "  POST /ocr - Process eviction notice OCR"
echo "  POST /generate-arguments - Generate legal arguments"
echo "  POST /generate-pdf - Create PDF documents"
echo ""
echo "Press Ctrl+C to stop the server"

uvicorn api:app --reload --host 0.0.0.0 --port 8000
