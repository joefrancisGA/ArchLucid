"""Cloud Agent dev host must keep known ARCH006 warnings from blocking startup."""

from __future__ import annotations

import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEV_BUILD = REPO_ROOT / "scripts" / "cloud-agent-dev-build.sh"
INSTALL = REPO_ROOT / "scripts" / "cloud-agent-install.sh"
START = REPO_ROOT / "scripts" / "cloud-agent-start.sh"
EXPECTED_ARG = "-p:WarningsNotAsErrors=ARCH006%3BARCH006a%3BARCH006b"


def test_dev_build_args_escape_arch006_family() -> None:
    completed = subprocess.run(
        ["bash", "-c", f'source "{DEV_BUILD}" && cloud_agent_dev_build_args'],
        check=True,
        capture_output=True,
        text=True,
    )

    assert completed.stdout.strip() == EXPECTED_ARG


def test_install_and_start_source_shared_dev_build_args() -> None:
    install_text = INSTALL.read_text(encoding="utf-8")
    start_text = START.read_text(encoding="utf-8")

    assert "cloud-agent-dev-build.sh" in install_text
    assert "cloud_agent_dev_build_args" in install_text
    assert "cloud-agent-dev-build.sh" in start_text
    assert "cloud_agent_dev_build_args" in start_text
    assert "Demo__Enabled=true" in start_text
    assert "Demo__SeedOnStartup=true" in start_text


if __name__ == "__main__":
    failures = 0

    for name, fn in sorted(globals().items()):
        if not name.startswith("test_") or not callable(fn):
            continue

        try:
            fn()
            print(f"PASS {name}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL {name}: {exc}")

    print(f"\n{failures} failure(s)")
    raise SystemExit(1 if failures else 0)
