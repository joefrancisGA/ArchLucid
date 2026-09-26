#!/usr/bin/env python3
"""Verify the bytes and classifications in a built buyer procurement ZIP."""

from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
import re
import zipfile
from pathlib import Path

STATUS = {"Evidence", "Self-assessment", "Template", "Deferred", "NDA-gated", "Owner-input-required"}
REQUIRED = {"manifest.json", "artifact_status_index.json", "ARTIFACT_STATUS_INDEX.md",
            "versions.txt", "redaction_report.md", "procurement-pack-quality.md", "README.md"}


def verify_pack(path: Path) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        with zipfile.ZipFile(path) as archive:
            names = archive.namelist()
            if len(names) != len(set(names)):
                errors.append("duplicate ZIP member")
            for name in names:
                if name.startswith("/") or posixpath.normpath(name).startswith("../") or "\\" in name:
                    errors.append(f"unsafe ZIP path: {name}")
            missing = REQUIRED - set(names)
            errors.extend(f"missing required pack file: {name}" for name in sorted(missing))
            if "manifest.json" not in names or "artifact_status_index.json" not in names:
                return {"disposition": "HOLD", "errors": errors, "warnings": warnings}
            manifest = json.loads(archive.read("manifest.json"))
            status_index = json.loads(archive.read("artifact_status_index.json"))
            rows = manifest["files"]
            indexed = status_index["files"]
            if len(rows) != len({row["pack_path"] for row in rows}):
                errors.append("duplicate manifest pack_path")
            if len(indexed) != len({row["pack_path"] for row in indexed}):
                errors.append("duplicate artifact status pack_path")
            status_by_path = {row["pack_path"]: row["artifact_status"] for row in indexed}
            if set(status_by_path) != {row["pack_path"] for row in rows}:
                errors.append("manifest and artifact status index file sets differ")
            for row in rows:
                name = row["pack_path"]
                if name not in names:
                    errors.append(f"manifest file missing from ZIP: {name}")
                    continue
                content = archive.read(name)
                if row["bytes"] != len(content) or row["sha256"] != hashlib.sha256(content).hexdigest():
                    errors.append(f"manifest digest or size mismatch: {name}")
                status = row["artifact_status"]
                if status not in STATUS or status_by_path.get(name) != status:
                    errors.append(f"invalid or inconsistent artifact status: {name}")
                if status in {"Evidence", "Self-assessment"} and name.endswith(".md"):
                    text = content.decode("utf-8", errors="replace")
                    if re.search(r"\b(?:TODO|TBD|placeholder-replace-before-launch)\b", text, re.I):
                        errors.append(f"buyer-visible placeholder: {name}")
            extras = set(names) - {row["pack_path"] for row in rows} - REQUIRED
            warnings.extend(f"unmanifested generated file: {name}" for name in sorted(extras))
    except (OSError, zipfile.BadZipFile, KeyError, ValueError, TypeError) as exc:
        errors.append(f"unreadable or malformed pack: {exc}")
    return {"disposition": "HOLD" if errors else "PASS", "errors": errors, "warnings": warnings}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pack", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()
    result = verify_pack(args.pack)
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["disposition"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
