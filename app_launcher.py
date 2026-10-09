import os
import sys
import socket
import webbrowser
import http.server
import socketserver

PORT = 8080

def get_resource_path(relative_path):
    """Obtiene la ruta absoluta de los recursos, compatible con PyInstaller EXE"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

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

def main():
    local_ip = get_local_ip()
    url = f"http://{local_ip}:{PORT}"

    # Establecer directorio de trabajo en la carpeta del ejecutable/recursos
    try:
        if getattr(sys, 'frozen', False):
            os.chdir(os.path.dirname(sys.executable))
        else:
            os.chdir(os.path.dirname(os.path.abspath(__file__)))
    except Exception:
        pass

    # Abrir navegador automaticamente con la IP real
    try:
        webbrowser.open(url)
    except Exception:
        pass

    # Servidor HTTP silencioso
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass # Silenciar logs en ejecutable

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == "__main__":
    main()
