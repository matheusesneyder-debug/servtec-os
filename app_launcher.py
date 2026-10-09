import os
import sys
import subprocess
import webbrowser
import socket
import http.server
import socketserver
import threading

PORT = 8080

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def start_local_server():
    try:
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            os.chdir(sys._MEIPASS)
        else:
            os.chdir(os.path.dirname(os.path.abspath(__file__)))
    except Exception:
        pass

    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
            httpd.serve_forever()
    except Exception:
        pass

def main():
    # Iniciar servidor local silencioso en segundo plano
    t = threading.Thread(target=start_local_server, daemon=True)
    t.start()

    # URL local para el ejecutable de la computadora (con app empaquetada)
    target_url = f"http://localhost:{PORT}"

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    ]

    opened = False
    for path in edge_paths + chrome_paths:
        if os.path.exists(path):
            try:
                subprocess.Popen([path, f"--app={target_url}"])
                opened = True
                break
            except Exception:
                pass

    if not opened:
        try:
            webbrowser.open(target_url)
        except Exception:
            pass

if __name__ == "__main__":
    main()
