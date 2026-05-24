#!/bin/bash
# test-composition.sh

docker-compose up -d

# Wait for services to be ready
sleep 10

# Check each service
frontend_status=$(docker-compose exec -T frontend wget -q --spider --server-response http://localhost:3000 2>&1 | grep "HTTP/" | awk '{print $2}')
backend_status=$(docker-compose exec -T backend wget -q --spider --server-response http://localhost:4000/health 2>&1 | grep "HTTP/" | awk '{print $2}')
db_status=$(docker-compose exec -T mongodb mongo --eval "db.stats()" | grep "ok" | awk '{print $3}')

# Verify statuses
if [[ "$frontend_status" == "200" && "$backend_status" == "200" && "$db_status" == "1" ]]; then
  echo "All services running properly!"
  exit 0
else
  echo "Service check failed!"
  echo "Frontend status: $frontend_status"
  echo "Backend status: $backend_status"
  echo "Database status: $db_status"
  exit 1
fi
