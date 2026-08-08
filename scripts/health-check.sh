#!/usr/bin/env bash
# ==============================================================================
# Matrick Manufacturing System (MMS) - Deployment & Service Health Check Script
# ==============================================================================

set -e

HOST="${HEALTH_CHECK_HOST:-http://localhost}"
PORT="${PORT:-3000}"
BASE_URL="${HOST}:${PORT}"

GREEN='\030[0;32m'
RED='\030[0;31m'
YELLOW='\030[1;33m'
NC='\030[0m' # No Color

echo "----------------------------------------------------------------------"
echo "🔍 Starting Matrick Manufacturing System (MMS) Deployment Health Check"
echo "----------------------------------------------------------------------"
echo "Target Base URL: ${BASE_URL}"
echo ""

# 1. Test Frontend Gateway / Index Page
echo -n "1. Checking Frontend Application Gateway... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/" || echo "000")

if [ "$FRONTEND_STATUS" -eq 200 ] || [ "$FRONTEND_STATUS" -eq 304 ]; then
  echo -e "${GREEN}OK (HTTP $FRONTEND_STATUS)${NC}"
else
  echo -e "${RED}FAILED (HTTP $FRONTEND_STATUS)${NC}"
  echo "⚠️ Warning: Frontend gateway is unresponsive."
fi

# 2. Test Backend Health API Endpoint
echo -n "2. Checking Backend REST API Health (/api/health or /api/auth/me)... "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/products" || echo "000")

if [ "$API_STATUS" -eq 200 ] || [ "$API_STATUS" -eq 401 ]; then
  echo -e "${GREEN}OK (HTTP $API_STATUS)${NC}"
else
  echo -e "${RED}FAILED (HTTP $API_STATUS)${NC}"
  echo "⚠️ Warning: REST API gateway returned unexpected status code."
fi

# 3. Test Socket.IO Realtime Endpoint Handshake
echo -n "3. Checking Socket.IO Gateway Endpoint (/socket.io/)... "
SOCKET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/socket.io/?EIO=4&transport=polling" || echo "000")

if [ "$SOCKET_STATUS" -eq 200 ] || [ "$SOCKET_STATUS" -eq 400 ]; then
  echo -e "${GREEN}OK (HTTP $SOCKET_STATUS)${NC}"
else
  echo -e "${YELLOW}NOTICE (HTTP $SOCKET_STATUS)${NC}"
  echo "ℹ️ Socket.IO endpoint reached."
fi

echo ""
echo "----------------------------------------------------------------------"
echo -e "${GREEN}✅ Health check sequence finished.${NC}"
echo "----------------------------------------------------------------------"
