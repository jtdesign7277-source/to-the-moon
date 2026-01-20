#!/bin/bash

# ============================================
# TO THE MOON - Development Startup Script
# Launches both frontend and backend servers
# ============================================

echo "🚀 TO THE MOON - Starting Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill any existing processes on our ports
echo -e "${YELLOW}Cleaning up old processes...${NC}"
lsof -ti:5000,5001,5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Backend
echo -e "${BLUE}Starting Backend Server (Port 5001)...${NC}"
cd "$PROJECT_ROOT/backend"

# Check if virtual environment exists, if not use system python
if [ -d "venv" ]; then
    source venv/bin/activate
    python api_server.py &
else
    python3 api_server.py &
fi
BACKEND_PID=$!
sleep 2

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Backend started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    exit 1
fi

# Start Frontend
echo -e "${BLUE}Starting Frontend Server (Port 5173)...${NC}"
cd "$PROJECT_ROOT"
npm run dev &
FRONTEND_PID=$!
sleep 3

# Check if frontend started successfully
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🚀 TO THE MOON is ready!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Frontend:  ${BLUE}http://localhost:5173${NC}"
echo -e "Backend:   ${BLUE}http://localhost:5001${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo ''; echo -e '${YELLOW}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Wait for processes
wait
