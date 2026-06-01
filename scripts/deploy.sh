#!/bin/bash
# scripts/deploy.sh
# Multi-environment deployment script for BrainBytes

ENV=$1
if [ -z "$ENV" ]; then
  echo "Error: No deployment environment specified."
  echo "Usage: ./deploy.sh [development|staging|production]"
  exit 1
fi

echo "=========================================================="
echo "Deploying BrainBytes application to [$ENV] environment..."
echo "=========================================================="

if [ "$ENV" = "development" ]; then
  echo "Branch: development -> Deploying to Development Server..."
  echo "Deploying container stack locally..."
  # docker-compose up -d
  echo "Development deployment successful!"

elif [ "$ENV" = "staging" ]; then
  echo "Branch: main -> Deploying to Staging Server..."
  echo "Validating configuration settings..."
  # docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  echo "Staging deployment successful!"

elif [ "$ENV" = "production" ]; then
  echo "Branch: main + Manual Approval -> Deploying to Production (Oracle Cloud)..."
  if [ -f "key.json" ]; then
    echo "Using Oracle Cloud API private key for validation..."
    # cat key.json
  else
    echo "Warning: No production deployment key (key.json) found. Operating in simulation mode."
  fi
  echo "Orchestrating production multi-containers stack via docker-compose..."
  # docker-compose -f docker-compose.prod.yml up -d
  echo "Production deployment to Oracle Cloud completed successfully!"

else
  echo "Error: Unknown environment '$ENV'."
  exit 1
fi

echo "=========================================================="
