"""Unit tests for check_workspace_mode_client_boundary.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_workspace_mode_client_boundary as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckWorkspaceModeClientBoundary(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_workspace_mode_client_boundary.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertIn("check_workspace_mode_client_boundary: OK", result.stdout)

    def test_file_uses_workspace_mode_hook_detects_value_import(self) -> None:
        text = (
            'import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";\n'
            "export function Strip() { const { isWorkingMode } = useWorkspaceMode(); }\n"
        )

        self.assertTrue(sut.file_uses_workspace_mode_hook(text))

    def test_file_uses_workspace_mode_hook_ignores_type_only_import(self) -> None:
        text = (
            'import type { WorkspaceModeAccountSyncState } from "@/components/WorkspaceModeProvider";\n'
        )

        self.assertFalse(sut.file_uses_workspace_mode_hook(text))

    def test_file_has_use_client_directive_requires_first_statement(self) -> None:
        self.assertTrue(sut.file_has_use_client_directive('"use client";\n\nimport x from "y";\n'))
        self.assertTrue(sut.file_has_use_client_directive('\ufeff"use client";\nimport x from "y";\n'))
        self.assertFalse(
            sut.file_has_use_client_directive(
                'import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";\n'
            )
        )

    def test_find_missing_client_boundaries_rejects_server_module(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            offender = root / "ClaimOrientationStrip.tsx"
            offender.write_text(
                'import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";\n'
                "export function Strip() {\n"
                "  const { isWorkingMode } = useWorkspaceMode();\n"
                "  return isWorkingMode;\n"
                "}\n",
                encoding="utf-8",
            )

            hits = sut.find_missing_client_boundaries(root)

            self.assertEqual(len(hits), 1)
            self.assertIn("ClaimOrientationStrip.tsx", hits[0])
            self.assertIn("use client", hits[0])

    def test_find_missing_client_boundaries_accepts_client_module(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ClaimOrientationStrip.tsx").write_text(
                '"use client";\n'
                'import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";\n'
                "export function Strip() {\n"
                "  const { isWorkingMode } = useWorkspaceMode();\n"
                "  return isWorkingMode;\n"
                "}\n",
                encoding="utf-8",
            )

            self.assertEqual(sut.find_missing_client_boundaries(root), [])

    def test_should_scan_skips_tests_and_provider(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            provider = root / "WorkspaceModeProvider.tsx"
            provider.write_text("export function useWorkspaceMode() { return null; }\n", encoding="utf-8")
            test_file = root / "Strip.test.tsx"
            test_file.write_text(
                'import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";\n',
                encoding="utf-8",
            )

            self.assertFalse(sut.should_scan(provider))
            self.assertFalse(sut.should_scan(test_file))


if __name__ == "__main__":
    unittest.main()
