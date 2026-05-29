from __future__ import annotations

import json
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPTS_ROOT = _REPO_ROOT / "scripts"


if str(_SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_ROOT))

import procurement_pack_validation as pp_val  # noqa: E402


def _load_pack_builder():
    script = _REPO_ROOT / "scripts" / "build_procurement_pack.py"
    spec = importlib.util.spec_from_file_location("build_procurement_pack_tested", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load procurement pack builder.")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module


class TestProcurementPackValidation(unittest.TestCase):
    def test_coherence_accepts_explicit_not_currently_issued(self) -> None:

        probe = "**SOC 2 Type II**: not currently issued (see roadmap)."
        err = pp_val.coherence_procurement_claims(probe)

        self.assertIsNone(err)

    def test_coherence_accepts_excluded_fast_lane_heading(self) -> None:

        probe = (
            "third-party SOC 2 Type II report\n\n"
            "**Excluded from this skim** — roadmap only; deferral narratives apply."
        )
        err = pp_val.coherence_procurement_claims(probe)

        self.assertIsNone(err)

    def test_coherence_rejects_orphan_type_ii_sentence(self) -> None:

        probe = "ArchLucid ships SOC 2 Type II attestation for enterprise buyers."
        err = pp_val.coherence_procurement_claims(probe)

        self.assertIsNotNone(err)

    def test_coherence_flags_third_party_inflight_combo(self) -> None:

        probe = "third-party audit is in-flight for our production stack."
        err = pp_val.coherence_procurement_claims(probe)

        self.assertIsNotNone(err)

    def test_forbidden_scan_finds_soc2_report_available(self) -> None:

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            market = root / "docs" / "go-to-market"
            market.mkdir(parents=True)

            (
                market / "TRUST_CENTER.md"
            ).write_text(
                "Our SOC 2 Type II audit report is available to prospects under NDA.\n",
                encoding="utf-8",
            )

            violations = pp_val.forbidden_assurance_phrases(root, canonical_entries=[])

        self.assertTrue(any("implies a SOC 2 Type II CPA report" in v for v in violations))
        self.assertTrue(any("TRUST_CENTER.md" in v for v in violations))

    def test_validate_script_exits_zero_on_repo(self) -> None:

        script = _REPO_ROOT / "scripts" / "validate_procurement_pack.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=str(_REPO_ROOT),
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_procurement_pack_index_script_exits_zero_on_repo(self) -> None:

        script = _REPO_ROOT / "scripts" / "ci" / "check_procurement_pack_index.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=str(_REPO_ROOT),
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_manifest_preview_writes_two_files(self) -> None:

        with tempfile.TemporaryDirectory() as tmp_src, tempfile.TemporaryDirectory() as tmp_out:
            root = Path(tmp_src)
            scripts = root / "scripts"
            scripts.mkdir(parents=True)

            gtm = root / "docs" / "go-to-market"
            gtm.mkdir(parents=True)

            for rel, body in (
                (
                    "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
                    "> **Scope:** test\n\n**Last reviewed:** 2099-01-01\n",
                ),
                (
                    "docs/go-to-market/TRUST_CENTER.md",
                    "> **Scope:** test\n\n**Last reviewed:** 2099-01-01\n",
                ),
                (
                    "docs/go-to-market/DPA_TEMPLATE.md",
                    "**Important — not legal advice:** x\nworking template y\n",
                ),
                (
                    "docs/go-to-market/ORDER_FORM_TEMPLATE.md",
                    "**Important — not legal advice:** x\nworking template y\n",
                ),
                ("foo.md", "# ok\n"),
            ):
                p = root / rel
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(body, encoding="utf-8")

            canonical = {
                "canonical_entries": [
                    {
                        "pack_path": "foo.md",
                        "source_repo_path": "foo.md",
                        "description": "fixture",
                        "artifact_status": "Evidence",
                    },
                ],
                "excluded_from_canonical_pack": [{"path": "omit.md", "reason": "fixture omit"}],
            }

            (scripts / "procurement_pack_canonical.json").write_text(
                json.dumps(canonical, indent=2) + "\n",
                encoding="utf-8",
            )

            out_dir = Path(tmp_out) / "preview"
            errs = pp_val.procurement_pack_quick_checks(
                root,
                max_assurance_review_age_days=5000,
                deal_ready_max_review_age_days=5000,
                preview_dir=out_dir,
                run_buyer_claim_scans=False,
                deal_ready_bundle=False,
            )

            self.assertEqual(errs, [])
            self.assertTrue((out_dir / "manifest.json").is_file())
            self.assertTrue((out_dir / "redaction_report.md").is_file())

    def test_artifact_status_index_includes_owner_caveat_and_review_pointer(self) -> None:

        builder = _load_pack_builder()

        with tempfile.TemporaryDirectory() as tmp:
            stage = Path(tmp)
            builder.write_artifact_status_index(
                stage,
                [
                    {
                        "pack_path": "SOC2_STATUS.md",
                        "source_repo_path": "docs/go-to-market/SOC2_STATUS_PROCUREMENT.md",
                        "description": "SOC 2 status statement",
                        "artifact_status": "Deferred",
                    }
                ],
            )

            markdown = (stage / "ARTIFACT_STATUS_INDEX.md").read_text(encoding="utf-8")
            data = json.loads((stage / "artifact_status_index.json").read_text(encoding="utf-8"))

        self.assertIn("Owner / function", markdown)
        self.assertIn("Caveat", markdown)
        self.assertIn("Deferred scope", markdown)
        self.assertEqual(data["files"][0]["owner_function"], "Executive owner")
        self.assertEqual(data["files"][0]["last_reviewed_utc"], "See source document")


    def test_format_deal_ready_disposition_pass_and_hold(self) -> None:
        passed = pp_val.format_deal_ready_disposition(ok=True, violations=[])
        held = pp_val.format_deal_ready_disposition(
            ok=False,
            violations=["missing canonical source `docs/go-to-market/TRUST_CENTER.md`"],
        )

        self.assertIn("Deal-ready disposition: PASS", passed)
        self.assertIn("Deferred procurement realism", passed)
        self.assertIn("Deal-ready disposition: HOLD", held)
        self.assertIn("Blocking reasons:", held)
        self.assertIn("TRUST_CENTER.md", held)

    def test_split_deal_ready_violations_classifies_stale_review_as_deferred(self) -> None:
        blocking, deferred = pp_val.split_deal_ready_violations(
            [
                "docs/go-to-market/TRUST_CENTER.md: Last reviewed is 200 days old (max 120)",
                "missing required deal-ready doc: docs/go-to-market/TRUST_CENTER.md",
            ]
        )

        self.assertEqual(len(blocking), 1)
        self.assertEqual(len(deferred), 1)
        self.assertIn("missing required deal-ready doc", blocking[0])

    def test_build_deal_ready_summary_passes_when_only_deferred_violations(self) -> None:
        summary = pp_val.build_deal_ready_summary(
            ok=False,
            violations=["docs/go-to-market/TRUST_CENTER.md: Last reviewed is 200 days old (max 120)"],
            strict_mode=True,
            deal_ready_mode=True,
        )

        self.assertEqual(summary["disposition"], "PASS")
        self.assertEqual(summary["blocking_violation_count"], 0)

    def test_build_deal_ready_summary_includes_scope_classification_rows(self) -> None:
        import procurement_scope_classification as scope_class

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            gtm.mkdir(parents=True)

            for name in (
                "ASSURANCE_STATUS_CANONICAL.md",
                "TRUST_CENTER.md",
                "SOC2_STATUS_PROCUREMENT.md",
                "CURRENT_ASSURANCE_POSTURE.md",
                "INCIDENT_COMMUNICATIONS_POLICY.md",
            ):
                (gtm / name).write_text(
                    "> **Scope:** test\n\n**Last reviewed:** 2099-01-01\nsecurity@archlucid.net\n",
                    encoding="utf-8",
                )

            summary = pp_val.build_deal_ready_summary(
                ok=True,
                violations=[],
                strict_mode=True,
                deal_ready_mode=True,
                root=root,
            )

            rows = list(summary["scope_classification_rows"])
            self.assertGreater(len(rows), 0)
            classifications = {str(r["classification"]) for r in rows}
            self.assertIn(scope_class.SCOPE_DEFERRED_SCOPE, classifications)
            self.assertIn(scope_class.SCOPE_V1_READY, classifications)

    def test_missing_deal_ready_doc_classified_blocking(self) -> None:
        import procurement_scope_classification as scope_class

        violation = "missing required deal-ready doc: docs/go-to-market/TRUST_CENTER.md"
        row = scope_class.violation_to_classification_row(violation)

        self.assertEqual(row["classification"], scope_class.SCOPE_BLOCKING)

    def test_soc2_catalog_row_is_deferred_scope(self) -> None:
        import procurement_scope_classification as scope_class

        soc2 = next(entry for entry in scope_class.PROCUREMENT_SCOPE_CATALOG if entry["id"] == "soc2-cpa-report")

        self.assertEqual(soc2["classification"], scope_class.SCOPE_DEFERRED_SCOPE)
        self.assertIn("SOC2_STATUS_PROCUREMENT.md", soc2["source_doc"])


    def test_collect_quality_snapshot_passes_on_minimal_fixture(self) -> None:

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            gtm.mkdir(parents=True)

            (gtm / "ASSURANCE_STATUS_CANONICAL.md").write_text(
                "> **Scope:** test\n\n**Last reviewed:** 2099-01-01\n",
                encoding="utf-8",
            )
            (gtm / "TRUST_CENTER.md").write_text(
                "> **Scope:** test\n\n**Last reviewed:** 2099-01-01\n",
                encoding="utf-8",
            )

            entries = [{"pack_path": "ok.md", "source_repo_path": "ok.md", "artifact_status": "Evidence"}]
            excluded = [{"path": "secret.md", "reason": "fixture"}]

            snapshot = pp_val.collect_quality_snapshot(
                root,
                canonical_entries=entries,
                excluded=excluded,
                pre_check_errors=[],
                strict_placeholder_violations=[],
                deal_ready_violations=None,
                strict_mode=True,
                deal_ready_mode=False,
                max_assurance_review_age_days=120,
            )

            self.assertEqual(snapshot["overall"], "pass")
            self.assertEqual(snapshot["redaction_omission_count"], 1)

            markdown = pp_val.procurement_pack_quality_markdown(snapshot)
            self.assertIn("procurement pack quality", markdown.lower())
            self.assertIn("PASS", markdown)

    def test_collect_quality_snapshot_fails_when_stale_last_reviewed(self) -> None:

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            gtm.mkdir(parents=True)

            (gtm / "ASSURANCE_STATUS_CANONICAL.md").write_text(
                "> **Scope:** test\n\n**Last reviewed:** 2000-01-01\n",
                encoding="utf-8",
            )
            (gtm / "TRUST_CENTER.md").write_text(
                "> **Scope:** test\n\n**Last reviewed:** 2000-01-01\n",
                encoding="utf-8",
            )

            snapshot = pp_val.collect_quality_snapshot(
                root,
                canonical_entries=[],
                excluded=[],
                pre_check_errors=[],
                strict_placeholder_violations=None,
                deal_ready_violations=None,
                strict_mode=False,
                deal_ready_mode=False,
                max_assurance_review_age_days=30,
            )

            self.assertGreater(snapshot["freshness_warning_count"], 0)


if __name__ == "__main__":
    unittest.main()
