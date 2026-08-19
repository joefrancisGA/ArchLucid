"""Batch tests: top-severity finding challenge validation and sponsor appendix export."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_top_severity_finding_challenge.py"
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "top-severity-finding-challenge.template.json"


class TopSeverityFindingChallengeBatchTests(unittest.TestCase):
    def test_proof_script_wires_top_severity_challenge(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-TopSeverityFindingChallengeFinding",
            "report_top_severity_finding_challenge.py",
            "sponsor-packet-appendix-top-severity-finding-challenge.md",
            "top-severity-finding-challenge-report.json",
        ):
            self.assertIn(token, text)

    def test_report_passes_complete_challenge(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            challenge = root / "challenge.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "runId": "run-1",
                    "pilotLabel": "acme-pilot",
                    "findingId": "F-001",
                    "findingTitle": "Private endpoint gap on approval path",
                    "evidenceChainId": "ec-001",
                    "evidenceChainComplete": True,
                    "counterArgument": "Team argued the control was covered by an adjacent NSG rule.",
                    "adjudication": "confirmed",
                    "adjudicationRationale": "Counter-argument did not map to the cited subnet scope in the packet.",
                    "reviewerIdentity": "principal architect reviewer",
                    "challengeUtc": "2026-06-16T16:00:00Z",
                },
            )
            challenge.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            out_md = root / "report.md"
            appendix = root / "appendix.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--challenge-json",
                    str(challenge),
                    "--json-out",
                    str(out_json),
                    "--markdown-out",
                    str(out_md),
                    "--appendix-out",
                    str(appendix),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("PASS", report["disposition"])
            appendix_text = appendix.read_text(encoding="utf-8")
            self.assertIn("Sponsor packet appendix", appendix_text)
            self.assertIn("Counter-argument considered", appendix_text)

    def test_strict_handoff_holds_when_chain_incomplete_without_notes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            challenge = root / "challenge.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "runId": "run-2",
                    "findingId": "F-002",
                    "evidenceChainId": "ec-002",
                    "evidenceChainComplete": False,
                    "counterArgument": "Packet lacked subnet detail.",
                    "adjudication": "revised",
                    "adjudicationRationale": "Finding severity downgraded pending subnet evidence.",
                    "reviewerIdentity": "release owner",
                    "challengeUtc": "2026-06-16T16:00:00Z",
                },
            )
            challenge.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--challenge-json",
                    str(challenge),
                    "--json-out",
                    str(out_json),
                    "--strict-sponsor-handoff",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(1, completed.returncode, msg=completed.stdout)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("HOLD", report["disposition"])


if __name__ == "__main__":
    unittest.main()
