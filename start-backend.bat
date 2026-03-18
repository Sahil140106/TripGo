@echo off
echo Starting TripGo Backend...
cd /d "%~dp0backend"
.\mvnw.cmd spring-boot:run
pause
