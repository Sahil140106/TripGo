@echo off
echo Starting TripGo Backend...
cd backend
.\mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx256m -Xms128m"
pause
