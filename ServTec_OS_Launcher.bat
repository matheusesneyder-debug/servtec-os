@echo off
title ServTec OS - Servidor Local
echo ============================================================
echo   Iniciando ServTec OS - Servicio Tecnico Profesional
echo ============================================================
echo.
echo Servidor escuchando en http://localhost:8080
echo Presiona CTRL + C en esta ventana si deseas detener el servidor.
echo.

:: Abre el navegador predeterminado automaticamente
start http://localhost:8080

:: Inicia el servidor HTTP de Python
python -m http.server 8080
