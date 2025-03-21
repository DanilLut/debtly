#!/bin/bash

docker build -t debtly-frontend-unslimmed:latest .
slim build --include-path /app --target debtly-frontend-unslimmed:latest --tag debtly-frontend:latest
docker rmi debtly-frontend-unslimmed:latest
docker compose up -d --force-recreate
rm slim.report.json
