#!/usr/bin/env python3
"""把「服務項目 後台」的資料寫進 services/index.html。

用法：python3 tools/build_services.py <資料> services/index.html
<資料> 可以是：
  - 後台 content 集合的 list 匯出資料夾（裡面有 main.json 或 content.json 等檔案），
  - 或單一 JSON 檔（文件內容本身，或含 data 欄位的匯出）。
"""
import json, os, sys

START = '<!--SERVICES-DATA-START-->'
END = '<!--SERVICES-DATA-END-->'

def load(src):
    if os.path.isdir(src):
        found = None
        for root, _, files in os.walk(src):
            for f in sorted(files):
                if f.endswith('.json'):
                    obj = json.load(open(os.path.join(root, f), encoding='utf-8'))
                    for cand in iter_docs(obj):
                        if is_content(cand):
                            found = cand
        if found is None:
            sys.exit('找不到服務內容資料（content/main）')
        return found
    obj = json.load(open(src, encoding='utf-8'))
    for cand in iter_docs(obj):
        if is_content(cand):
            return cand
    sys.exit('檔案裡沒有服務內容資料')

def iter_docs(obj):
    yield obj
    if isinstance(obj, dict):
        for k in ('data', 'doc', 'value'):
            if isinstance(obj.get(k), dict):
                yield from iter_docs(obj[k])
        for k in ('docs', 'documents', 'items', 'results'):
            if isinstance(obj.get(k), list):
                for x in obj[k]:
                    yield from iter_docs(x)
    elif isinstance(obj, list):
        for x in obj:
            yield from iter_docs(x)

def is_content(d):
    return isinstance(d, dict) and isinstance(d.get('groups'), list) and isinstance(d.get('plans'), list)

def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    data = load(sys.argv[1])
    data = {k: v for k, v in data.items() if not k.startswith('_')}
    page = sys.argv[2]
    s = open(page, encoding='utf-8').read()
    a, b = s.index(START), s.index(END)
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    block = START + '\n<script type="application/json" id="svc-data">' + blob + '</script>\n'
    s = s[:a] + block + s[b:]
    open(page, 'w', encoding='utf-8').write(s)
    print(json.dumps({'groups': len(data['groups']), 'plans': len(data['plans']), 'bytes': len(blob.encode())}, ensure_ascii=False))

if __name__ == '__main__':
    main()
