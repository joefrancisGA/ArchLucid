"""Unit tests for V1 connector catalog ↔ scope alignment guard."""
from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


def _load_guard():
    script = _REPO / "scripts/ci/assert_v1_connector_catalog_alignment.py"
    spec = importlib.util.spec_from_file_location("_v1_connector_catalog_alignment_guard", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load guard module.")

    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


class TestAssertV1ConnectorCatalogAlignment(unittest.TestCase):
    def test_catalog_alignment_repo_passes(self):
        script = _REPO / "scripts/ci/assert_v1_connector_catalog_alignment.py"
        result = subprocess.run(
            [sys.executable, str(script), "--no-doc-code-notice"],
            cwd=_REPO,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_scope_commits_detection_positive(self):
        scope_snippet = (
            "**ServiceNow** — … **Two-way status sync** (ServiceNow → ArchLucid finding state) "
            "is **committed for V1.1** …"
        )
        jira_snippet = (
            "**Jira** — … **bi-directional status sync** (Jira → ArchLucid finding state) "
            "is **committed for V1.1** …"
        )

        snow, jira = G.scope_commits_inbound_itsm_sync(scope_snippet + jira_snippet)

        self.assertTrue(snow)
        self.assertTrue(jira)

    def test_catalog_row_patterns_detect_good_catalog_fragment(self):
        catalog_frag = (
            "| **ServiceNow** | … **Two-way** ServiceNow → ArchLucid **status-only** sync is "
            "**committed for V1.1** (…) |\n"
            "| **Jira** | … **bi-directional** Jira → ArchLucid status sync is **committed for V1.1** (…) |"
        )

        snow_c, jira_c = G.catalog_committed_row_patterns_present(catalog_frag)

        self.assertTrue(snow_c)
        self.assertTrue(jira_c)

    def test_forbidden_denials_detect_stale_servicenow_row(self):
        stale = "**Two-way** SNOW→ArchLucid status sync **not** committed unless owner promotes."

        hits = G.forbidden_denials_in_text(stale)

        self.assertGreater(len(hits), 0)

    def test_validate_catalog_reports_missing_servicenow_row(self):
        scope_ok = (
            "**ServiceNow** foo **Two-way status sync** (ServiceNow → ArchLucid finding state) "
            "is **committed for V1.1** "
            "**Jira** bar **bi-directional status sync** (Jira → ArchLucid finding state) "
            "is **committed for V1.1**"
        )
        bad_catalog = "| **Jira** | **bi-directional** Jira → ArchLucid status sync is **committed for V1.1** |"

        errs = G.validate_catalog_against_scope(scope_ok, bad_catalog, "synthetic.md")

        self.assertTrue(any("ServiceNow" in e for e in errs))

    def test_primary_catalog_matches_scope_on_disk(self):
        scope_text = G.read_repo_text(_REPO, G.V1_SCOPE_REL)
        catalog_text = G.read_repo_text(_REPO, G.PRIMARY_INTEGRATION_CATALOG_REL)
        errs = G.validate_catalog_against_scope(scope_text, catalog_text, G.PRIMARY_INTEGRATION_CATALOG_REL.as_posix())

        self.assertEqual(errs, [])
