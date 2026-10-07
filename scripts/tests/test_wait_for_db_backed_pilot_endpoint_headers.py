"""Wait-script probes must not send workspace/project headers under bound-claim auth."""

from pathlib import Path
import unittest

REPO_ROOT = Path(__file__).resolve().parents[2]
WAIT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "wait-for-db-backed-pilot-endpoint.sh"


class WaitForDbBackedPilotEndpointHeadersTests(unittest.TestCase):
    def test_bound_claim_auth_omits_workspace_and_project_headers(self) -> None:
        source = WAIT_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("bound_claim_auth", source)
        self.assertIn("LIVE_API_KEY", source)
        self.assertIn("LIVE_JWT_TOKEN", source)
        self.assertIn('x-workspace-id', source)
        self.assertIn(
            'if [ "${bound_claim_auth}" -eq 0 ]; then',
            source,
            "ApiKey/JWT probes must skip x-workspace-id / x-project-id (header-only escalation 403).",
        )


if __name__ == "__main__":
    unittest.main()
