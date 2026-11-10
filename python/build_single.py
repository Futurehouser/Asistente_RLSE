"""Genera dist/Asistente_RLSE.py: un único archivo con la versión y las imágenes incrustadas."""
import base64
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

with open(os.path.join(ROOT, 'package.json'), encoding='utf-8') as f:
    version = json.load(f)['version']

images = {}
img_dir = os.path.join(HERE, 'img')
for name in sorted(os.listdir(img_dir)):
    if name.endswith('.png'):
        with open(os.path.join(img_dir, name), 'rb') as f:
            images[name[:-4]] = base64.b64encode(f.read()).decode('ascii')

with open(os.path.join(HERE, 'app.py'), encoding='utf-8') as f:
    src = f.read()

ver_marker = 'APP_VERSION = None  # @@VERSION@@'
img_marker = 'EMBEDDED_IMAGES = {}  # @@IMAGES@@'
assert ver_marker in src and img_marker in src, 'Marcadores no encontrados en app.py'

img_lines = ['EMBEDDED_IMAGES = {'] + [f"    {k!r}: (\n" + '\n'.join(
    f"        '{v[i:i + 100]}'" for i in range(0, len(v), 100)) + '\n    ),' for k, v in images.items()] + ['}']
src = src.replace(ver_marker, f'APP_VERSION = {version!r}').replace(img_marker, '\n'.join(img_lines))

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'Asistente_RLSE.py')
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write(src)
print(f'{out} ({os.path.getsize(out) // 1024} KB, v{version}, {len(images)} imágenes)')
