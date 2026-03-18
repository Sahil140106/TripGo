@echo off
cd %~dp0
echo Installing MySQL driver...
npm install mysql2
echo Starting Data Migration...
node migrate-to-firebase.js
pause
