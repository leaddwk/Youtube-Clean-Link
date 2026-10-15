"""Build unpacked-install, Web Store upload, and complete submission archives."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
files = ['manifest.json', 'cleaner.js', 'page.js', 'popup.html', 'popup.css', 'popup.js']
files += sorted(set(manifest['icons'].values()))
files += [resource['path'] for resource in manifest['declarative_net_request']['rule_resources']]
for name in files:
    assert (root / name).is_file(), name
output = root / 'dist'
output.mkdir(exist_ok=True)
version = manifest['version']
archive = output / f'youtube-clean-link-{version}.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as bundle:
    for name in files + ['README.md']:
        bundle.write(root / name, 'youtube-clean-link/' + name)
store = output / f'youtube-clean-link-{version}-webstore.zip'
with ZipFile(store, 'w', ZIP_DEFLATED) as bundle:
    for name in files:
        bundle.write(root / name, name)
with ZipFile(store) as bundle:
    assert bundle.testzip() is None
    assert 'manifest.json' in bundle.namelist()
    assert set(bundle.namelist()) == set(files)
for package in (archive, store):
    print(f'{package} ({package.stat().st_size:,} bytes)')
if (root / 'store/assets/screenshot-01.png').is_file():
    kit = output / f'youtube-clean-link-{version}-submission-kit.zip'
    with ZipFile(kit, 'w', ZIP_DEFLATED) as bundle:
        bundle.write(store, store.name)
        for item in sorted((root / 'store').rglob('*')):
            if item.is_file():
                bundle.write(item, item.relative_to(root).as_posix())
        bundle.write(root / 'PRIVACY.md', 'PRIVACY.md')
    print(f'{kit} ({kit.stat().st_size:,} bytes)')
