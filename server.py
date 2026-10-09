import socket
import webbrowser
import http.server
import socketserver
import os

PORT = 8080

def get_local_ip():
    """Detecta automaticamente la IP local de la computadora en la red Wi-Fi"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

local_ip = get_local_ip()
url = f"http://{local_ip}:{PORT}"

print("============================================================")
print("   SERVTEC OS - SERVIDOR AUTOMATICO MULTIDISPOSITIVO")
print("============================================================")
print(f" -> IP Detectada Automaticamente: {local_ip}")
print(f" -> URL de Acceso Taller / iPhone: {url}")
print("============================================================")
print("Abriendo navegador automaticamente...")

# Cambiar al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Abrir el navegador con la IP real automaticamente
webbrowser.open(url)

# Iniciar servidor escuchando en todas las interfaces de red (0.0.0.0)
class ReuseHandler(http.server.SimpleHTTPRequestHandler):
    pass

with socketserver.TCPServer(("0.0.0.0", PORT), ReuseHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
