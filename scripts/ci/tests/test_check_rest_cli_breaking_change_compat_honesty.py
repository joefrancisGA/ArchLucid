from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_rest_cli_breaking_change_compat_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_rest_cli_breaking_change_compat_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load REST+CLI breaking-change compatibility honesty guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_contract(root: Path) -> None:
    path = root / G.CONTRACT_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "**TB-1559** REST+CLI compatibility claim map.",
                "**TB-1560** honesty CI.",
                "M-288",
                "CI anchors for **TB-1560**",
                "OpenApiContractSnapshotTests",
                "ADR 0006",
                "check_rest_cli_breaking_change_compat_honesty.py",
            ]
        ),
        encoding="utf-8",
    )


def _write_code_anchors(root: Path) -> None:
    for rel, body in (
        (G.SNAPSHOT_TEST_REL, "public sealed class OpenApiContractSnapshotTests\n"),
        (G.API_CONTRACTS_REL, "GET /openapi/v1.json\nOpenApiContractSnapshotTests\n"),
        (G.OPENAPI_DRIFT_REL, "OpenApiContractSnapshotTests\n"),
        (G.DEPRECATION_MIDDLEWARE_REL, "ApiDeprecationHeadersMiddleware\nSunset\n"),
    ):
        path = root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")


def _write_scan_targets(root: Path, *, body: str) -> None:
    _write_contract(root)
    _write_code_anchors(root)

    for rel in G.DOCS_TO_SCAN:
        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


class TestRestCliBreakingChangeCompatHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.rest_cli_breaking_change_compat_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_ci_semver_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="OpenAPI snapshot CI guarantees backward compatibility for /v1 pilots.\n",
            )
            violations = G.rest_cli_breaking_change_compat_honesty_violations(root)

            self.assertTrue(any("backward compat" in v.lower() for v in violations))

    def test_sunset_always_on_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Sunset headers are always published on every API response.\n",
            )
            violations = G.rest_cli_breaking_change_compat_honesty_violations(root)

            self.assertTrue(any("sunset" in v.lower() for v in violations))

    def test_forbidden_example_table_row_is_allowed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body='| "CI proves backward compatibility / semver for `/v1`" | CI proves OpenAPI snapshot equality |\n',
            )
            violations = G.rest_cli_breaking_change_compat_honesty_violations(root)

            self.assertEqual(violations, [], msg="\n".join(violations))


if __name__ == "__main__":
    unittest.main()
