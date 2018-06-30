import json
from npre import bbs98
from http.server import BaseHTTPRequestHandler, HTTPServer
from cgi import parse_header, parse_multipart, parse_qs
from base64 import b64encode

pre = bbs98.PRE()


class KmsHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        # TODO: Implement HTTPS connection
        self._set_headers()
        if self.path == '/generate_key_pair':
            private_key = pre.gen_priv(dtype=bytes)
            public_key = pre.priv2pub(private_key)
            keys = {
                'private': b64encode(private_key).decode('utf-8'),
                'public': b64encode(public_key).decode('utf-8')
            }
            json_string = json.dumps(keys).encode('ascii')
            self.wfile.write(json_string)

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        ctype, pdict = parse_header(self.headers.getheader('content-type'))
        if ctype == 'multipart/form-data':
            postvars = parse_multipart(self.rfile, pdict)
        elif ctype == 'application/x-www-form-urlencoded':
            length = int(self.headers.getheader('content-length'))
            postvars = parse_qs(self.rfile.read(length), keep_blank_values=1)
        else:
            postvars = {}
        self._set_headers()
        if self.path == '/encrypt' or self.path == '/decrypt':
            file = postvars['file']
            key = postvars['key']
            encrypted_file = pre.encrypt(key, file)
            json_string = json.dumps(encrypted_file)
            self.wfile.write(json_string)


def run(server_class=HTTPServer, handler_class=KmsHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print('starting server')
    httpd.serve_forever()


if __name__ == '__main__':
    run()
