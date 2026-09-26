from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("verify_procurement_pack", ROOT / "scripts/verify_procurement_pack.py")
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def test_built_pack_passes_and_tampering_holds(tmp_path: Path) -> None:
    pack = tmp_path / "buyer.zip"
    subprocess.run([sys.executable, str(ROOT / "scripts/build_procurement_pack.py"), "--out", str(pack)],
                   cwd=ROOT, check=True, capture_output=True, text=True)
    assert module.verify_pack(pack)["disposition"] == "PASS"

    altered = tmp_path / "altered.zip"
    with zipfile.ZipFile(pack) as source, zipfile.ZipFile(altered, "w") as target:
        for name in source.namelist():
            payload = source.read(name)
            target.writestr(name, payload + b"changed" if name == "trust-center.md" else payload)
    result = module.verify_pack(altered)
    assert result["disposition"] == "HOLD"
    assert any("digest or size mismatch: trust-center.md" in error for error in result["errors"])


def test_status_mismatch_holds(tmp_path: Path) -> None:
    pack = tmp_path / "buyer.zip"
    subprocess.run([sys.executable, str(ROOT / "scripts/build_procurement_pack.py"), "--out", str(pack)],
                   cwd=ROOT, check=True, capture_output=True, text=True)
    altered = tmp_path / "altered.zip"
    with zipfile.ZipFile(pack) as source, zipfile.ZipFile(altered, "w") as target:
        for name in source.namelist():
            payload = source.read(name)
            if name == "artifact_status_index.json":
                index = json.loads(payload)
                index["files"][0]["artifact_status"] = "Deferred"
                payload = json.dumps(index).encode()
            target.writestr(name, payload)
    assert any("inconsistent artifact status" in error for error in module.verify_pack(altered)["errors"])
