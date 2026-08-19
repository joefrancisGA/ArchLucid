"""Tests for assert_legacy_config_sunset_not_passed.py."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import assert_legacy_config_sunset_not_passed as sut


def test_main_succeeds_on_real_repo_file() -> None:
    assert sut.main() == 0


def test_main_fails_when_sunset_constant_is_past(tmp_path: Path) -> None:
    stub = tmp_path / "LegacyWarningsStub.cs"
    stub.write_text(
        """
public static class X {
    public const string LegacyConfigurationKeysHardEnforcementNoEarlierThan = "2000-01-01";
}
""",
        encoding="utf-8",
    )

    script = Path(sut.__file__).resolve()
    env = {**os.environ, "ARCHLUCID_LEGACY_SUNSET_SOURCE_FILE": str(stub)}
    rc = subprocess.run([sys.executable, str(script)], env=env, check=False, capture_output=True, text=True)

    assert rc.returncode == 1
