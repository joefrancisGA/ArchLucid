import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from local_service_fault_proxy import run


class LocalProxyTests(unittest.TestCase):
    def test_disposable_local_api_proxy(self):
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200 if self.path == "/health/live" else 404)
                self.end_headers()
            def log_message(self, *_args):
                pass
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = run(server.server_port, .05, 1, .01)
            self.assertEqual(result["status"], "pass")
            self.assertTrue(result["observedInjectedHttp503"])
            self.assertIsNotNone(result["recoverySecondsObserved"])
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_unhealthy_upstream_rejected(self):
        with self.assertRaises((RuntimeError, ValueError)):
            run(0, .05, 1, .01)

    def test_unbounded_outage_rejected(self):
        with self.assertRaises(ValueError):
            run(5000, 60, 1, .01)


if __name__ == "__main__":
    unittest.main()
