"""Validate the exact production upload archive; stdlib only."""
import json
import re
import struct
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
source = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
version = source['version']
archive = root / f'dist/youtube-clean-link-{version}-webstore.zip'
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    names = set(bundle.namelist())
    assert 'manifest.json' in names, 'manifest must be at archive root'
    manifest = json.loads(bundle.read('manifest.json'))
    assert manifest == source
    assert manifest['manifest_version'] == 3
    assert len(manifest['name']) <= 75 and len(manifest['description']) <= 132
    assert re.fullmatch(r'\d+(\.\d+){0,3}', version)
    assert set(manifest['permissions']) == {'activeTab','clipboardWrite','declarativeNetRequestWithHostAccess'}
    assert '<all_urls>' not in json.dumps(manifest)
    assert "'unsafe-eval'" not in json.dumps(manifest)
    assert not any(name.startswith(('tests/','scripts/','store/','.git/','_metadata/')) for name in names)
    for name in names:
        assert bundle.read(name) == (root / name).read_bytes(), f'Package/source mismatch: {name}'
    for size, name in manifest['icons'].items():
        raw = bundle.read(name)
        assert raw[:8] == b'\x89PNG\r\n\x1a\n'
        assert struct.unpack('>II', raw[16:24]) == (int(size), int(size))
    scripts = {name for item in manifest['content_scripts'] for name in item['js']}
    scripts.add('popup.js')
    scripts.add('cleaner.js')
    for name in scripts:
        text = bundle.read(name).decode('utf-8')
        assert not re.search(r'\b(eval|fetch|XMLHttpRequest|WebSocket)\s*\(', text), name
        assert not re.search(r'new\s+Function\s*\(', text), name
    for entry in manifest['declarative_net_request']['rule_resources']:
        rules = json.loads(bundle.read(entry['path']))
        for rule in rules:
            assert rule['action']['type'] == 'redirect'
            assert set(rule['condition']['resourceTypes']) <= {'main_frame','sub_frame'}
            removed = rule['action']['redirect']['transform']['queryTransform']['removeParams']
            assert not set(removed) & {'v','t','start','end','list','index'}
    extraction = root / f'dist/webstore-unpacked-{version}'
    extraction.mkdir(parents=True, exist_ok=True)
    bundle.extractall(extraction)
for name, dims, alpha in [
    ('icon-128.png',(128,128),True),
    ('screenshot-01.png',(1280,800),False),
    ('screenshot-02.png',(1280,800),False),
    ('promo-440x280.png',(440,280),False)
]:
    raw = (root / 'store/assets' / name).read_bytes()
    assert struct.unpack('>II', raw[16:24]) == dims, name
    assert raw[24] == 8, '8-bit channels required'
    assert raw[25] == (6 if alpha else 2), f'{name}: RGB/RGBA mismatch'
print('PASS: root manifest, MV3, permission scope, runtime file list, PNG formats and dimensions, no remote-network code, time-preserving network rules.')
print(f'Unpacked production extension: {extraction}')
