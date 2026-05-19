#!/bin/bash

echo "=== BrainBytes Container Connectivity Tests ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Start containers
echo "Starting containers..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start (10 seconds)..."
sleep 10

echo ""
echo "=== Test 1: Backend can reach MongoDB ==="
if docker-compose exec -T backend ping -c 3 mongodb; then
  echo -e "${GREEN}✓ Backend can reach MongoDB${NC}"
else
  echo -e "${RED}✗ Backend cannot reach MongoDB${NC}"
fi

echo ""
echo "=== Test 2: Frontend can reach Backend Health Endpoint ==="
if docker-compose exec -T frontend curl -I http://backend:4000/api/health; then
  echo -e "${GREEN}✓ Frontend can reach Backend${NC}"
else
  echo -e "${RED}✗ Frontend cannot reach Backend${NC}"
fi

echo ""
echo "=== Test 3: Backend Health Check Response ==="
docker-compose exec -T backend curl -s http://localhost:4000/api/health | jq '.'

echo ""
echo "=== Test 4: Backend MongoDB Connection Status ==="
RESPONSE=$(docker-compose exec -T backend curl -s http://localhost:4000/api/health)
DB_STATUS=$(echo $RESPONSE | jq -r '.databaseConnected')

if [ "$DB_STATUS" = "true" ]; then
  echo -e "${GREEN}✓ MongoDB connection verified${NC}"
else
  echo -e "${RED}✗ MongoDB connection failed${NC}"
fi

echo ""
echo "Tests completed!"