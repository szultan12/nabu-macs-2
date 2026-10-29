"""Build local-only release assets; never installs or publishes anything."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def build(destination=None):
    destination = destination or ROOT / 'dist'
    destination.mkdir(parents=True, exist_ok=True)
    source = ROOT / 'custom_components' / 'nabu_macs'
    archive = destination / 'nabu_macs.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as output:
        for path in sorted(source.rglob('*')):
            if not path.is_file() or '__pycache__' in path.parts or path.suffix == '.pyc':
                continue
            info = zipfile.ZipInfo(path.relative_to(source).as_posix(), (2026, 10, 28, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            output.writestr(info, path.read_bytes())
        for name in ('LICENSE', 'NOTICE.md', 'LICENSE.upstream'):
            if name in output.namelist():
                continue
            info = zipfile.ZipInfo(name, (2026, 10, 28, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            output.writestr(info, (ROOT / name).read_bytes())
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (destination / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
    return archive

if __name__ == '__main__':
    print(build())
