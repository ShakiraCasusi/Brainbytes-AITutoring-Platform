#!/bin/bash
# run-all-tests.sh

# Start with a clean environment
docker-compose down -v
docker-compose build

# Start containers
echo "Starting containers ... "
docker-compose up -d

# Wait for all services to be ready
echo "Waiting for services to start ... "
sleep 10

# Run Dockerfile linting
echo "Running Dockerfile linting ... "
hadolint frontend/Dockerfile
hadolint backend/Dockerfile

# Run API tests
echo "Running API tests ... "
cd backend && npm test

# Run frontend tests
echo "Running frontend tests ... "
cd ../frontend && npm test

# Run E2E tests
echo "Running E2E tests ... "
cd ../e2e && npm test

# Run security scans
echo "Running security scans ... "
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image brainbytes-frontend:latest
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image brainbytes-backend:latest

# Clean up
echo "Cleaning up ... "
cd ..
docker-compose down

echo "All tests completed!"
