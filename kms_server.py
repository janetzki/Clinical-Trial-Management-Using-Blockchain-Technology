import json
import urllib
from umbral import (
    keys,
    pre,
    signing
)
from http.server import BaseHTTPRequestHandler, HTTPServer
from cgi import parse_header, parse_multipart
from base64 import b64encode, b64decode


class KmsHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', 'http://localhost')
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        # TODO: Implement HTTPS connection
        self._set_headers()
        if self.path == '/generate_key_pair':
            private_key = keys.UmbralPrivateKey.gen_key()
            public_key = private_key.get_pubkey()
            private_key = private_key.to_bytes()
            public_key = public_key.to_bytes()
            key_pair = {
                'private': b64encode(private_key).decode('utf-8'),
                'public': b64encode(public_key).decode('utf-8')
            }
            json_string = json.dumps(key_pair).encode('ascii')
            self.wfile.write(json_string)

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        ctype, pdict = parse_header(self.headers.get('content-type'))
        if ctype == 'multipart/form-data':
            postvars = parse_multipart(self.rfile, pdict)
        elif ctype == 'application/x-www-form-urlencoded':
            length = int(self.headers.get('content-length'))
            postvars = urllib.parse.parse_qs(self.rfile.read(length), keep_blank_values=1)
        else:
            postvars = {}
        self._set_headers()

        # For an explanation, visit https://github.com/nucypher/pyUmbral
        if self.path == '/encrypt' or self.path == '/decrypt':
            file = postvars[b'file'][0]
            public_key = b64decode(postvars[b'public_key'][0])
            public_key = keys.UmbralPublicKey.from_bytes(public_key)

            if self.path == '/encrypt':
                encrypted_file, capsule = pre.encrypt(public_key, file)
                json_string = json.dumps({
                    'file': b64encode(encrypted_file).decode('utf-8'),
                    'capsule': b64encode(capsule.to_bytes()).decode('utf-8')
                }).encode('ascii')
            else:
                private_key = b64decode(postvars[b'private_key'][0])
                private_key = keys.UmbralPrivateKey.from_bytes(private_key)
                file = b64decode(postvars[b'file'][0])
                capsule = b64decode(postvars[b'capsule'][0])
                capsule = pre.Capsule.from_bytes(capsule, public_key.params)

                if b're_key' in postvars:
                    owner_public_key = b64decode(postvars[b'owner_public_key'][0])
                    owner_public_key = keys.UmbralPublicKey.from_bytes(owner_public_key)
                    capsule.set_correctness_keys(delegating=owner_public_key,
                                                 receiving=public_key,
                                                 verifying=owner_public_key,
                                                 )
                    cfrags = postvars[b're_key'][0].split(b',')
                    for cfrag in cfrags:
                        cfrag = b64decode(cfrag)
                        cfrag = pre.CapsuleFrag.from_bytes(cfrag)
                        capsule.attach_cfrag(cfrag)

                decrypted_file = pre.decrypt(file, capsule, private_key, public_key)
                json_string = json.dumps({
                    'file': decrypted_file.decode('utf8')
                }).encode('ascii')
            self.wfile.write(json_string)

        elif self.path == '/grant_access':
            bobs_public_key = b64decode(postvars[b'public_key'][0])
            bobs_public_key = keys.UmbralPublicKey.from_bytes(bobs_public_key)
            alices_private_key = b64decode(postvars[b'private_key'][0])
            alices_private_key = keys.UmbralPrivateKey.from_bytes(alices_private_key)
            capsule = postvars[b'capsule'][0]
            capsule = b64decode(capsule)
            capsule = pre.Capsule.from_bytes(capsule, alices_private_key.get_pubkey().params)
            capsule.set_correctness_keys(delegating=alices_private_key.get_pubkey(),
                                         receiving=bobs_public_key,
                                         verifying=alices_private_key.get_pubkey(),
                                         )
            signer = signing.Signer(alices_private_key)
            kfrags = pre.split_rekey(alices_private_key, signer, bobs_public_key, 1, 1)
            cfrags = list()
            for kfrag in kfrags:
                cfrag = pre.reencrypt(kfrag, capsule)
                cfrags.append(b64encode(cfrag.to_bytes()).decode('utf8'))
            json_string = json.dumps({
                're_key': ','.join(cfrags)
            }).encode('ascii')
            self.wfile.write(json_string)


def run(server_class=HTTPServer, handler_class=KmsHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print('Starting server')
    httpd.serve_forever()


if __name__ == '__main__':
    run()
