"""Build an installable archive using only Python's standard library."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
files = ['manifest.json', 'cleaner.js', 'page.js', 'popup.html', 'popup.css', 'popup.js', 'README.md']
files += sorted(set(manifest['icons'].values()))
files += [resource['path'] for resource in manifest['declarative_net_request']['rule_resources']]
for name in files:
    assert (root / name).is_file(), name
output = root / 'dist'
output.mkdir(exist_ok=True)
archive = output / f"youtube-clean-link-{manifest['version']}.zip"
with ZipFile(archive, 'w', ZIP_DEFLATED) as bundle:
    for name in files:
        bundle.write(root / name, 'youtube-clean-link/' + name)
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
print(f'{archive} ({archive.stat().st_size:,} bytes, {len(files)} files)')
