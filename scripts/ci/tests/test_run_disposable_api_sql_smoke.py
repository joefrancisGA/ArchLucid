"""Exercise the hosted smoke wrapper without a Docker daemon or .NET build."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest


CI = Path(__file__).resolve().parents[1]
WRAPPER = CI / "run_disposable_api_sql_smoke.sh"


class DisposableApiSqlSmokeTests(unittest.TestCase):
    def invoke(self, test_exit=0, server_exit=False, port="127.0.0.1:49155"):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docker").write_text(
                """#!/usr/bin/env bash
set -eu
printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"
case "$1" in
  run) test -n "$MSSQL_SA_PASSWORD"; echo fake-container ;;
  exec) test -n "$SQLCMDPASSWORD"; [[ "$FAKE_SERVER_EXIT" = false ]] ;;
  inspect) echo "$FAKE_RUNNING" ;;
  port) echo "$FAKE_PORT" ;;
  rm) test "$3" = fake-container ;;
  *) exit 2 ;;
esac
""",
                encoding="utf-8",
            )
            (root / "python3").write_text(
                """#!/usr/bin/env bash
set -eu
if [[ "$1" = '-c' ]]; then
  echo 'fake-password-used-only-in-this-unit-test'
else
  [[ "$ARCHLUCID_API_TEST_SQL" = 'Server=127.0.0.1,49155;Database=master;'* ]]
  [[ "$ARCHLUCID_API_TEST_SQL" = "$ARCHLUCID_SQL_TEST" ]]
  [[ -z "${SQLCMDPASSWORD+x}${MSSQL_SA_PASSWORD+x}" ]]
  printf '%s\n' "$@" > "$FAKE_RUNNER_LOG"
  exit "$FAKE_TEST_EXIT"
fi
""",
                encoding="utf-8",
            )
            for name in ("docker", "python3"):
                (root / name).chmod(0o700)
            env = os.environ | {
                "PATH": str(root) + os.pathsep + os.environ["PATH"],
                "FAKE_DOCKER_LOG": str(root / "docker.log"),
                "FAKE_RUNNER_LOG": str(root / "runner.log"),
                "FAKE_TEST_EXIT": str(test_exit),
                "FAKE_SERVER_EXIT": str(server_exit).lower(),
                "FAKE_RUNNING": str(not server_exit).lower(),
                "FAKE_PORT": port,
            }
            completed = subprocess.run(
                ["bash", str(WRAPPER), str(root / "results")],
                env=env, capture_output=True, text=True, timeout=10,
            )
            docker = (root / "docker.log").read_text(encoding="utf-8").splitlines()
            log = root / "runner.log"
            argv = log.read_text(encoding="utf-8").splitlines() if log.exists() else []
            return completed, docker, argv

    def test_runs_exactly_three_named_cases_with_the_pinned_local_fixture(self):
        completed, docker, argv = self.invoke()
        self.assertEqual(completed.returncode, 0, completed.stderr)
        cases = [argv[i + 1] for i, arg in enumerate(argv) if arg == "--case"]
        self.assertEqual(len(cases), 3)
        all_cases = (CI / "focused-api-sql-cases.txt").read_text(encoding="utf-8").splitlines()
        self.assertTrue(set(cases).issubset(all_cases))
        self.assertEqual([case.rsplit(".", 1)[-1] for case in cases], [
            "Fresh_sql_review_finalization_replays_the_sealed_artifact_inventory",
            "Repeat_finalize_rejects_a_corrupt_persisted_inventory_hash",
            "Tenant_b_audit_list_take_200_excludes_tenant_a_run_id_sql_tb295",
        ])
        self.assertIn("--publish 127.0.0.1::1433", docker[0])
        self.assertIn("@sha256:", docker[0])
        self.assertTrue(any("READ_COMMITTED_SNAPSHOT ON" in command for command in docker))
        self.assertEqual(docker[-1], "rm -f fake-container")
        self.assertNotIn("fake-password-used-only", "\n".join(docker) + completed.stdout + completed.stderr)

    def test_test_failure_is_visible_and_still_cleans_up(self):
        completed, docker, _ = self.invoke(test_exit=1)
        self.assertEqual(completed.returncode, 1)
        self.assertEqual(docker[-1], "rm -f fake-container")

    def test_startup_failure_does_not_run_tests_or_leak_the_container(self):
        completed, docker, argv = self.invoke(server_exit=True)
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("exited before accepting connections", completed.stderr)
        self.assertFalse(argv)
        self.assertEqual(docker[-1], "rm -f fake-container")

    def test_non_loopback_binding_is_rejected(self):
        completed, docker, argv = self.invoke(port="0.0.0.0:49155")
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("did not publish a loopback port", completed.stderr)
        self.assertFalse(argv)
        self.assertEqual(docker[-1], "rm -f fake-container")
