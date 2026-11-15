# Icon generator helper (not part of the site): serves gen.html and writes the files it POSTs into
# assets/icon/, plus favicon.ico at the repo root. Stdlib only, nothing to install.
# Usage: python -I tools/icon-gen/server.py, open http://127.0.0.1:5199/ and run `await run(true)` in the console.
import base64, json, os, struct
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "assets", "icon")


def ico_from_pngs(pngs):
    """Build a .ico that embeds PNG images (supported by all current browsers)."""
    head = struct.pack("<HHH", 0, 1, len(pngs))
    offset = 6 + 16 * len(pngs)
    entries, blobs = b"", b""
    for size, data in pngs:
        s = 0 if size >= 256 else size
        entries += struct.pack("<BBBBHHII", s, s, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
        blobs += data
    return head + entries + blobs


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        body = open(os.path.join(HERE, "gen.html"), "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        req = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        written, icos = [], []
        for f in req["files"]:
            name = os.path.basename(f["name"])
            data = base64.b64decode(f["b64"]) if "b64" in f else f["text"].encode("utf-8")
            if f.get("ico"):
                icos.append((f["ico"], data))  # the small sizes only go into favicon.ico
                continue
            with open(os.path.join(OUT, name), "wb") as fh:
                fh.write(data)
            written.append(name)
        if icos:
            with open(os.path.join(ROOT, "favicon.ico"), "wb") as fh:
                fh.write(ico_from_pngs(sorted(icos)))
            written.append("favicon.ico")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(written).encode())

    def log_message(self, *a):
        pass


HTTPServer(("127.0.0.1", 5199), H).serve_forever()
