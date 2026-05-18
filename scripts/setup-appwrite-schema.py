#!/usr/bin/env python3
"""
Cree le schema Appwrite manquant pour Digital QR Cards.

La migration Firebase -> Appwrite a cree les collections `users` et `cards`
mais JAMAIS leurs attributs -> l'app ne peut rien lire/ecrire -> rejets App Store.

USAGE :
  1. Appwrite Console -> ton projet -> Settings -> API Keys -> Create API Key
     Scopes : cocher au minimum  databases.read  et  databases.write
  2. Lancer :
       APPWRITE_API_KEY="colle_ta_cle_ici" python3 scripts/setup-appwrite-schema.py
  3. (Optionnel) supprimer la cle API ensuite dans la console.

Le script est idempotent : relançable sans risque (ignore ce qui existe deja).
"""
import json, os, sys, time, urllib.request, urllib.error

ENDPOINT = "https://fra.cloud.appwrite.io/v1"
PROJECT  = "69c62a550031e83fd11e"
DATABASE = "digitalqrcard"
API_KEY  = os.environ.get("APPWRITE_API_KEY", "").strip()

if not API_KEY:
    sys.exit("ERREUR : variable APPWRITE_API_KEY manquante.\n"
             '  APPWRITE_API_KEY="..." python3 scripts/setup-appwrite-schema.py')

def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(ENDPOINT + path, data=data, method=method, headers={
        "X-Appwrite-Project": PROJECT,
        "X-Appwrite-Key": API_KEY,
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}

def s(col, key, size, default=None, required=False):
    st, d = call("POST", f"/databases/{DATABASE}/collections/{col}/attributes/string",
                 {"key": key, "size": size, "required": required, "default": default})
    tag = "OK" if st in (201, 202) else ("DEJA OK" if st == 409 else f"ERREUR {st}: {d.get('message','')}")
    print(f"  [{col}] string  {key:<20} -> {tag}")

def integer(col, key, default=0):
    st, d = call("POST", f"/databases/{DATABASE}/collections/{col}/attributes/integer",
                 {"key": key, "required": False, "default": default})
    tag = "OK" if st in (201, 202) else ("DEJA OK" if st == 409 else f"ERREUR {st}: {d.get('message','')}")
    print(f"  [{col}] integer {key:<20} -> {tag}")

def index(col, key, attrs, orders=None):
    st, d = call("POST", f"/databases/{DATABASE}/collections/{col}/indexes",
                 {"key": key, "type": "key", "attributes": attrs,
                  "orders": orders or ["ASC"] * len(attrs)})
    tag = "OK" if st in (201, 202) else ("DEJA OK" if st == 409 else f"ERREUR {st}: {d.get('message','')}")
    print(f"  [{col}] index   {key:<20} -> {tag}")

print("== Collection users ==")
s("users", "email", 320)
s("users", "display_name", 256)
s("users", "subscription", 32, default="free")
s("users", "created_at", 64)
s("users", "updated_at", 64)
s("users", "iap_transaction_id", 256)

print("== Collection cards ==")
s("cards", "user_id", 64)
s("cards", "name", 256)
s("cards", "title", 256)
s("cards", "company", 256)
s("cards", "phone", 64)
s("cards", "email", 320)
s("cards", "website", 512)
s("cards", "address", 512)
s("cards", "location", 256)
s("cards", "theme", 64)
s("cards", "fields", 50000)
s("cards", "avatar_emoji", 32)
s("cards", "avatar_color", 32)
s("cards", "background_color", 32)
integer("cards", "card_order", 0)
s("cards", "created_at", 64)
s("cards", "updated_at", 64)

print("\nAttente que les attributs soient 'available' (~15s)...")
time.sleep(15)

print("== Index ==")
index("cards", "idx_user_id", ["user_id"])
index("cards", "idx_card_order", ["card_order"])

print("\nTermine. Verifie dans la console Appwrite que les collections "
      "`users` et `cards` ont bien tous leurs attributs.")
