"""Tests for assert_nuget_no_high_critical_vulnerabilities.py."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPTS_CI = _REPO_ROOT / "scripts" / "ci"

if str(_SCRIPTS_CI) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_CI))

import assert_nuget_no_high_critical_vulnerabilities as sut


class TestNugetVulnerabilityGate(unittest.TestCase):
    def test_parse_strips_bom_and_prefix_noise(self) -> None:
        raw = "\ufeffRestore complete.\n" + json.dumps({"version": 1, "projects": []}) + "\n"
        data = sut.parse_dotnet_json_report(raw)

        self.assertEqual(data["version"], 1)

    def test_blocks_high_not_moderate(self) -> None:
        report = {
            "projects": [
                {
                    "path": "A.csproj",
                    "frameworks": [
                        {
                            "framework": "net10.0",
                            "topLevelPackages": [
                                {
                                    "id": "SafePkg",
                                    "vulnerabilities": [{"severity": "Moderate", "advisoryurl": "https://x"}],
                                },
                                {
                                    "id": "BadPkg",
                                    "vulnerabilities": [
                                        {"severity": "High", "advisoryurl": "https://high"},
                                        {"severity": "Low", "advisoryurl": "https://low"},
                                    ],
                                },
                            ],
                        }
                    ],
                }
            ]
        }
        blocking = sut.find_blocking_vulnerabilities(report)

        self.assertEqual(len(blocking), 1)
        self.assertEqual(blocking[0][0], "BadPkg")
        self.assertEqual(blocking[0][1], "high")

    def test_blocks_critical_case_insensitive(self) -> None:
        report = {
            "projects": [
                {
                    "frameworks": [
                        {
                            "transitivePackages": [
                                {
                                    "id": "Tx",
                                    "vulnerabilities": [{"severity": "CRITICAL", "advisoryUrl": "https://c"}],
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        blocking = sut.find_blocking_vulnerabilities(report)

        self.assertEqual(len(blocking), 1)
        self.assertEqual(blocking[0][1], "critical")


if __name__ == "__main__":
    unittest.main()
