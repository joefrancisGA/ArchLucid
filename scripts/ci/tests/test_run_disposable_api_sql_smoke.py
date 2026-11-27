"""Exercise the hosted smoke wrapper without a Docker daemon or .NET build."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


CI = Path(__file__).resolve().parents[1]
WRAPPER = CI / "run_disposable_api_sql_smoke.sh"
SQL_PIN = "sha256:db9a8fe3098b7e8bbde41106bdc7caee942e97124e5fdb71b872ca208de3092d"


class DisposableApiSqlSmokeTests(unittest.TestCase):
    def invoke(self, test_exit=0, server_exit=False, port="127.0.0.1:49155", image_id=SQL_PIN, repo_digest="", extra_args=()):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docker").write_text(
                """#!/usr/bin/env bash
set -eu
printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"
case "$1" in
  pull) test "$2" = 'mcr.microsoft.com/mssql/server:2022-CU22-ubuntu-22.04' ;;
  image) printf '%s\n' "$FAKE_IMAGE_ID" "$FAKE_REPO_DIGEST" ;;
  run) test -n "$MSSQL_SA_PASSWORD"; test "${!#}" = "$FAKE_IMAGE_ID"; echo fake-container ;;
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
elif [[ "${!#}" = --prepare-only ]]; then
  test ! -e "$FAKE_DOCKER_LOG"
  exec "$REAL_PYTHON" "$@"
else
  [[ "${!#}" = --use-prepared ]]
  [[ "$ARCHLUCID_API_TEST_SQL" = 'Server=127.0.0.1,49155;Database=master;'* ]]
  [[ "$ARCHLUCID_API_TEST_SQL" = "$ARCHLUCID_SQL_TEST" ]]
  [[ -z "${SQLCMDPASSWORD+x}${MSSQL_SA_PASSWORD+x}" ]]
  printf '%s\n' "$@" > "$FAKE_RUNNER_LOG"
  exit "$FAKE_TEST_EXIT"
fi
""",
                encoding="utf-8",
            )
            (root / "git").write_text("#!/usr/bin/env bash\nset -eu\n[[ \"$*\" = 'rev-parse HEAD' ]]\necho " + "a" * 40 + "\n",
                                      encoding="utf-8")
            for name in ("docker", "python3", "git"):
                (root / name).chmod(0o700)
            env = os.environ | {
                "PATH": str(root) + os.pathsep + os.environ["PATH"],
                "REAL_PYTHON": sys.executable,
                "FAKE_DOCKER_LOG": str(root / "docker.log"),
                "FAKE_RUNNER_LOG": str(root / "runner.log"),
                "FAKE_TEST_EXIT": str(test_exit),
                "FAKE_SERVER_EXIT": str(server_exit).lower(),
                "FAKE_RUNNING": str(not server_exit).lower(),
                "FAKE_PORT": port,
                "FAKE_IMAGE_ID": image_id,
                "FAKE_REPO_DIGEST": repo_digest,
            }
            completed = subprocess.run(
                ["bash", str(WRAPPER), str(root / "results"), *extra_args],
                cwd=CI.parents[1], env=env, capture_output=True, text=True, timeout=10,
            )
            docker_log = root / "docker.log"
            docker = docker_log.read_text(encoding="utf-8").splitlines() if docker_log.exists() else []
            log = root / "runner.log"
            argv = log.read_text(encoding="utf-8").splitlines() if log.exists() else []
            summary = root / "results" / "summary.json"
            plan = json.loads(summary.read_text(encoding="utf-8")) if summary.exists() else None
            return completed, docker, argv, plan

    def test_runs_exactly_three_named_cases_with_the_pinned_local_fixture(self):
        completed, docker, argv, plan = self.invoke()
        self.assertEqual(completed.returncode, 0, completed.stderr)
        cases = [argv[i + 1] for i, arg in enumerate(argv) if arg == "--case"]
        self.assertEqual(len(cases), 3)
        self.assertEqual([row["case"] for row in plan["cases"]], cases)
        all_cases = (CI / "focused-api-sql-cases.txt").read_text(encoding="utf-8").splitlines()
        self.assertTrue(set(cases).issubset(all_cases))
        self.assertEqual([case.rsplit(".", 1)[-1] for case in cases], [
            "Fresh_sql_review_finalization_replays_the_sealed_artifact_inventory",
            "Repeat_finalize_rejects_a_corrupt_persisted_inventory_hash",
            "Tenant_b_audit_list_take_200_excludes_tenant_a_run_id_sql_tb295",
        ])
        self.assertIn("pull mcr.microsoft.com/mssql/server:2022-CU22-ubuntu-22.04", docker)
        start = next(command for command in docker if command.startswith("run "))
        self.assertIn("--publish 127.0.0.1::1433", start)
        self.assertTrue(start.endswith(" " + SQL_PIN))
        self.assertTrue(any("READ_COMMITTED_SNAPSHOT ON" in command for command in docker))
        self.assertEqual(docker[-1], "rm -f fake-container")
        self.assertNotIn("fake-password-used-only", "\n".join(docker) + completed.stdout + completed.stderr)

    def test_test_failure_is_visible_and_still_cleans_up(self):
        completed, docker, _, _ = self.invoke(test_exit=1)
        self.assertEqual(completed.returncode, 1)
        self.assertEqual(docker[-1], "rm -f fake-container")

    def test_runs_only_the_selected_case(self):
        case = next(name for name in (CI / "focused-api-sql-cases.txt").read_text(encoding="utf-8").splitlines()
                    if name.endswith(".Repeat_finalize_rejects_a_corrupt_persisted_inventory_hash"))
        completed, docker, argv, plan = self.invoke(extra_args=("--case", case))
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual([argv[i + 1] for i, arg in enumerate(argv) if arg == "--case"], [case])
        self.assertEqual([row["case"] for row in plan["cases"]], [case])
        self.assertEqual(docker[-1], "rm -f fake-container")

    def test_rejects_an_unlisted_case_before_starting_docker(self):
        completed, docker, argv, plan = self.invoke(extra_args=("--case", "ArchLucid.Api.Tests.Other.Test"))
        self.assertEqual(completed.returncode, 2)
        self.assertFalse(docker)
        self.assertFalse(argv)
        self.assertIsNone(plan)

    def test_startup_failure_does_not_run_tests_or_leak_the_container(self):
        completed, docker, argv, plan = self.invoke(server_exit=True)
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("exited before accepting connections", completed.stderr)
        self.assertFalse(argv)
        self.assertEqual(plan["unreported"], 3)
        self.assertEqual([row["outcome"] for row in plan["cases"]], ["not-started"] * 3)
        self.assertEqual(docker[-1], "rm -f fake-container")

    def test_non_loopback_binding_is_rejected(self):
        completed, docker, argv, _ = self.invoke(port="0.0.0.0:49155")
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("did not publish a loopback port", completed.stderr)
        self.assertFalse(argv)
        self.assertEqual(docker[-1], "rm -f fake-container")

    def test_changed_image_digest_is_rejected_before_the_fixture_starts(self):
        completed, docker, argv, _ = self.invoke(image_id="sha256:" + "0" * 64)
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("did not match the published digest", completed.stderr)
        self.assertFalse(argv)
        self.assertFalse(any(command.startswith("run ") for command in docker))

    def test_registry_manifest_pin_can_verify_an_image_with_a_distinct_id(self):
        image_id = "sha256:" + "a" * 64
        completed, docker, _, _ = self.invoke(
            image_id=image_id, repo_digest=f"mcr.microsoft.com/mssql/server@{SQL_PIN}",
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        start = next(command for command in docker if command.startswith("run "))
        self.assertTrue(start.endswith(" " + image_id))
