import json, os, urllib.request, urllib.error
K=os.environ['APPWRITE_API_KEY']
BASE='https://fra.cloud.appwrite.io/v1'; PROJ='69c62a550031e83fd11e'
DB='digitalqrcard'; COL='cards'
DEMO_UID='69c65913001ac2f25565'

def call(m, p, b=None):
    d = json.dumps(b).encode() if b else None
    r = urllib.request.Request(BASE+p, data=d, method=m, headers={
        'X-Appwrite-Project': PROJ, 'X-Appwrite-Key': K,
        'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(r, timeout=30) as x:
            raw = x.read(); return x.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except: return e.code, {}

# Wipe any existing demo cards first (idempotent re-run)
st, d = call('GET', f'/databases/{DB}/collections/{COL}/documents?queries[]={urllib.parse.quote(json.dumps({"method":"equal","attribute":"user_id","values":[DEMO_UID]}))}'.replace('%2F', '/')) if False else call('GET', f'/databases/{DB}/collections/{COL}/documents')
import urllib.parse
q = urllib.parse.quote(json.dumps({"method":"equal","attribute":"user_id","values":[DEMO_UID]}))
st, d = call('GET', f'/databases/{DB}/collections/{COL}/documents?queries[]={q}')
for doc in d.get('documents', []):
    call('DELETE', f'/databases/{DB}/collections/{COL}/documents/'+doc['$id'])
    print('  cleanup deleted', doc.get('name'))

now = '2026-05-19T10:00:00.000Z'
cards = [
    {
        'user_id': DEMO_UID, 'name': 'Marie Dupont', 'title': 'Marketing Director',
        'company': 'BrightLabs', 'phone': '+33 6 12 34 56 78',
        'email': 'marie.dupont@brightlabs.com', 'website': 'https://brightlabs.com',
        'address': '12 rue de la Paix, 75002 Paris', 'location': 'Paris, France',
        'theme': 'pantone-classic-blue',
        'fields': json.dumps([
            {'type':'LinkedIn','value':'linkedin.com/in/mariedupont'},
            {'type':'Instagram','value':'@marie.brightlabs'},
        ]),
        'avatar_emoji': '👩‍💼', 'avatar_color': '#3b82f6', 'background_color': '',
        'card_order': 0, 'created_at': now, 'updated_at': now,
    },
    {
        'user_id': DEMO_UID, 'name': 'Jean Martin', 'title': 'Software Engineer',
        'company': 'Northbound Studio', 'phone': '+41 78 555 12 34',
        'email': 'jean@northbound.studio', 'website': 'https://northbound.studio',
        'address': 'Rue du Stand 8, 1204 Geneva', 'location': 'Geneva, Switzerland',
        'theme': 'forest-green',
        'fields': json.dumps([
            {'type':'GitHub','value':'github.com/jeanm'},
            {'type':'LinkedIn','value':'linkedin.com/in/jeanmartin'},
        ]),
        'avatar_emoji': '👨‍💻', 'avatar_color': '#10b981', 'background_color': '',
        'card_order': 1, 'created_at': now, 'updated_at': now,
    },
    {
        'user_id': DEMO_UID, 'name': 'Sophie Laurent', 'title': 'Architect',
        'company': 'Atelier Laurent', 'phone': '+33 1 45 67 89 01',
        'email': 'sophie@atelier-laurent.fr', 'website': 'https://atelier-laurent.fr',
        'address': '47 avenue Mozart, 75016 Paris', 'location': 'Paris, France',
        'theme': 'sunset-orange',
        'fields': json.dumps([
            {'type':'Instagram','value':'@atelier_laurent'},
        ]),
        'avatar_emoji': '🏛️', 'avatar_color': '#f97316', 'background_color': '',
        'card_order': 2, 'created_at': now, 'updated_at': now,
    },
]

for c in cards:
    st, d = call('POST', f'/databases/{DB}/collections/{COL}/documents',
                 {'documentId': 'unique()', 'data': c})
    print('create', c['name'], '->', st, d.get('$id') if st in (200,201) else d.get('message'))

# Verify
st, d = call('GET', f'/databases/{DB}/collections/{COL}/documents?queries[]={q}')
print('\nDemo account cards now:', d.get('total'))
for doc in d.get('documents', []):
    print(' -', doc.get('name'), '|', doc.get('title'), '@', doc.get('company'))
