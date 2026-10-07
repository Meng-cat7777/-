# usage: python3 build_shop.py <src_dir> <published_list.txt> <page_in.html> <page_out.html>
# src_dir holds <collection>/<doc_id>.json for bracelets, stones, settings (ArtifactData out_dir layout).
# published_list.txt: one published file path of the product page per line (e.g. img/<id>.jpg).
# Prints JSON: photo ids that are not yet published as img/<id>.* (download + publish those).
import json, glob, os, re, sys, datetime
src, listing, page_in, page_out = sys.argv[1:5]
published = [l.strip() for l in open(listing, encoding='utf8') if l.strip()] if os.path.exists(listing) else []

def load(c):
    out = []
    for f in sorted(glob.glob(os.path.join(src, c, '*.json'))):
        d = json.load(open(f, encoding='utf8'))
        d['id'] = os.path.basename(f)[:-5]
        out.append(d)
    return out

br, st, se = load('bracelets'), load('stones'), load('settings')
missing = []
for d in br + st:
    i = (d.get('image') or '').strip()
    if not i:
        d['image'] = ''
        continue
    hit = next((p for p in published if p.startswith('img/' + i + '.')), None)
    if hit:
        d['image'] = hit
    else:
        missing.append(i)
        d['image'] = ''
settings = next((x for x in se if x['id'] == 'design'), {})
settings.pop('id', None)
data = {'bracelets': br, 'stones': st, 'settings': settings,
        'updatedAt': datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'}
blob = json.dumps(data, ensure_ascii=False).replace('</', '<\\/').replace('<!--', '<\\!--')
html = open(page_in, encoding='utf8').read()
block = '<!--SHOP-DATA-START--><script type="application/json" id="shop-data">' + blob + '</script><!--SHOP-DATA-END-->'
new, n = re.subn(r'<!--SHOP-DATA-START-->.*?<!--SHOP-DATA-END-->', lambda m: block, html, count=1, flags=re.S)
if n != 1:
    sys.exit('ERROR: data markers not found in page')
open(page_out, 'w', encoding='utf8').write(new)
print(json.dumps({'missing_photos': missing, 'bracelets': len(br), 'stones': len(st)}))
