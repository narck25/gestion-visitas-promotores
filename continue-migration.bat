@echo off
echo Presionando Enter para continuar con la migración...
echo.

REM Este script simula presionar Enter
echo. | npx prisma migrate dev --name "sync_schema"