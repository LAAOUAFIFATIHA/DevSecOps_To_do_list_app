#!/bin/bash

echo "=========================================="
echo "FRONTEND CONTAINER DIAGNOSTICS"
echo "=========================================="
echo ""

echo "1. CHECKING CONTAINER STATUS"
echo "----------------------------"
docker ps -a | grep task_web_container
echo ""

echo "2. CHECKING CONTAINER LOGS"
echo "----------------------------"
docker logs task_web_container 2>&1 | tail -50
echo ""

echo "3. CHECKING NGINX PROCESS"
echo "----------------------------"
docker exec task_web_container ps aux 2>&1
echo ""

echo "4. CHECKING NGINX CONFIGURATION"
echo "----------------------------"
docker exec task_web_container nginx -t 2>&1
echo ""

echo "5. CHECKING BUILD FILES"
echo "----------------------------"
docker exec task_web_container ls -la /usr/share/nginx/html 2>&1
echo ""

echo "6. CHECKING NGINX CONFIG FILE"
echo "----------------------------"
docker exec task_web_container cat /etc/nginx/conf.d/default.conf 2>&1
echo ""

echo "7. CHECKING LISTENING PORTS"
echo "----------------------------"
docker exec task_web_container netstat -tlnp 2>&1 || docker exec task_web_container ss -tlnp 2>&1
echo ""

echo "8. CHECKING IF INDEX.HTML EXISTS"
echo "----------------------------"
docker exec task_web_container cat /usr/share/nginx/html/index.html 2>&1 | head -20
echo ""

echo "9. TESTING NGINX FROM INSIDE CONTAINER"
echo "----------------------------"
docker exec task_web_container wget -O- http://localhost:80 2>&1 | head -20
echo ""

echo "=========================================="
echo "DIAGNOSTICS COMPLETE"
echo "=========================================="
