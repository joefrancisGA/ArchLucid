"""Exercise the hosted smoke wrapper without a Docker daemon or .NET build."""

import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest


CI = Path(__file__).resolve().parents[1]
WRAPPER = CI / "run_disposable_api_sql_smoke.sh"
SQL_PIN = "sha256:db9a8fe3098b7e8bbde41106bdc7caee942e97124e5fdb71b872ca208de3092d"
SYNTHETIC_DOTNET = """\
import fcntl
import os
from pathlib import Path
import subprocess
import sys
import time


def hold_lock(output, role):
    with (output / f'{role}.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        (output / f'{role}.pid').write_text(str(os.getpid()), encoding='utf-8')
        if role == 'host':
            (output / 'runner.pid').write_text(str(os.getppid()), encoding='utf-8')
            subprocess.Popen([sys.executable, __file__, '--grandchild', str(output)])
        time.sleep(30)


if sys.argv[1] == '--grandchild':
    hold_lock(Path(sys.argv[2]), 'grandchild')
else:
    args = sys.argv
    output = Path(args[args.index('--results-directory') + 1])
    name = args[args.index('--filter') + 1].split('=', 1)[1]
    if output.name == '02' and os.environ['FAKE_CANCEL_TEST'] == 'true':
        hold_lock(output, 'host')
    else:
        failed = output.name == '02' and os.environ['FAKE_TEST_EXIT'] != '0'
        outcome = 'Failed' if failed else 'Passed'
        (output / 'case.trx').write_text(
            f'<TestRun><Results><UnitTestResult testName="{name}" outcome="{outcome}"/></Results></TestRun>',
            encoding='utf-8')
        sys.exit(1 if failed else 0)
"""


class DisposableApiSqlSmokeTests(unittest.TestCase):
    def invoke(self, test_exit=0, server_exit=False, port="127.0.0.1:49155", image_id=SQL_PIN,
               repo_digest="", extra_args=(), cancel_signal=None, stall="", cleanup_check=""):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docker").write_text(
                """#!/usr/bin/env bash
set -eu
printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"
if [[ "$1" = "$FAKE_DOCKER_STALL" ]]; then
  exec sleep 30
fi
case "$1" in
  pull) test "$2" = 'mcr.microsoft.com/mssql/server:2022-CU22-ubuntu-22.04' ;;
  image) printf '%s\n' "$FAKE_IMAGE_ID" "$FAKE_REPO_DIGEST" ;;
  run) test -n "$MSSQL_SA_PASSWORD"; test "${!#}" = "$FAKE_IMAGE_ID"; echo fake-container ;;
  exec) test -n "$SQLCMDPASSWORD"; [[ "$FAKE_SERVER_EXIT" = false ]] ;;
  inspect) echo "$FAKE_RUNNING" ;;
  port) echo "$FAKE_PORT" ;;
  rm)
    if [[ "$FAKE_DOCKER_STALL" = run ]]; then
      [[ "$3" = archlucid-focused-sql-* ]]
    else
      test "$3" = fake-container
    fi
    if [[ "$FAKE_CANCEL_TEST" = true ]]; then
      "$REAL_PYTHON" -c 'import json, sys; assert json.load(open(sys.argv[1]))["cases"][1]["outcome"] == "interrupted"' "$FAKE_SUMMARY"
      echo 'checkpoint saved before cleanup' >> "$FAKE_DOCKER_LOG"
    fi
    if [[ -n "$FAKE_CLEANUP_CHECK" ]]; then exit 1; fi ;;
  container)
    [[ "$2 $3 $4 $5" == 'ls --all --no-trunc --filter' && "$7" == --format ]]
    case "$FAKE_CLEANUP_CHECK" in
      absent) : ;;
      present) printf '%s\n' "${6#*=}" ;;
      unexpected) printf '%s\n' 'unexpected-list-entry' ;;
      unavailable) exit 7 ;;
      timeout) exec sleep 30 ;;
      *) exit 2 ;;
    esac ;;
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
elif [[ "${!#}" = --record-fixture-timeout=* || "${!#}" = --record-fixture-cleanup=* ]]; then
  exec "$REAL_PYTHON" "$@"
else
  [[ "${!#}" = --use-prepared ]]
  [[ "$ARCHLUCID_API_TEST_SQL" = 'Server=127.0.0.1,49155;Database=master;'* ]]
  [[ "$ARCHLUCID_API_TEST_SQL" = "$ARCHLUCID_SQL_TEST" ]]
  [[ -z "${SQLCMDPASSWORD+x}${MSSQL_SA_PASSWORD+x}" ]]
  printf '%s\n' "$@" > "$FAKE_RUNNER_LOG"
  if [[ "$FAKE_CANCEL_TEST" = true || "$FAKE_DOCKER_STALL" = rm || -n "$FAKE_CLEANUP_CHECK" ]]; then
    exec "$REAL_PYTHON" "$@"
  fi
  exit "$FAKE_TEST_EXIT"
fi
""",
                encoding="utf-8",
            )
            (root / "git").write_text("#!/usr/bin/env bash\nset -eu\n[[ \"$*\" = 'rev-parse HEAD' ]]\necho " + "a" * 40 + "\n",
                                      encoding="utf-8")
            for name in ("docker", "python3", "git"):
                (root / name).chmod(0o700)
            if cancel_signal is not None or stall == "rm" or cleanup_check:
                dotnet = root / "dotnet"
                dotnet.write_text(f"#!{sys.executable}\n" + SYNTHETIC_DOTNET, encoding="utf-8")
                dotnet.chmod(0o700)
            env = os.environ | {
                "PATH": str(root) + os.pathsep + os.environ["PATH"],
                "REAL_PYTHON": sys.executable,
                "FAKE_DOCKER_LOG": str(root / "docker.log"),
                "FAKE_DOCKER_STALL": stall,
                "FAKE_CLEANUP_CHECK": cleanup_check,
                "FAKE_RUNNER_LOG": str(root / "runner.log"),
                "FAKE_TEST_EXIT": str(test_exit),
                "FAKE_SERVER_EXIT": str(server_exit).lower(),
                "FAKE_RUNNING": str(not server_exit).lower(),
                "FAKE_PORT": port,
                "FAKE_IMAGE_ID": image_id,
                "FAKE_REPO_DIGEST": repo_digest,
                "FAKE_CANCEL_TEST": str(cancel_signal is not None).lower(),
                "FAKE_SUMMARY": str(root / "results" / "summary.json"),
                "ARCHLUCID_FOCUSED_SQL_SETUP_SECONDS": "2" if stall in ("pull", "run", "exec") else "180",
                "ARCHLUCID_FOCUSED_SQL_CLEANUP_SECONDS": "1" if stall == "rm" else "2" if cleanup_check == "timeout" else "15",
            }
            command = ["bash", str(WRAPPER), str(root / "results"), *extra_args]
            if cancel_signal is None:
                completed = subprocess.run(command, cwd=CI.parents[1], env=env, capture_output=True, text=True, timeout=10)
            else:
                completed = self.cancel_running_wrapper(command, env, root / "results" / "02", cancel_signal)
            docker_log = root / "docker.log"
            docker = docker_log.read_text(encoding="utf-8").splitlines() if docker_log.exists() else []
            log = root / "runner.log"
            argv = log.read_text(encoding="utf-8").splitlines() if log.exists() else []
            summary = root / "results" / "summary.json"
            plan = json.loads(summary.read_text(encoding="utf-8")) if summary.exists() else None
            return completed, docker, argv, plan

    def cancel_running_wrapper(self, command, env, active, signum):
        import fcntl

        with subprocess.Popen(command, cwd=CI.parents[1], env=env, text=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE) as wrapper:
            verified = False
            try:
                deadline = time.monotonic() + 5
                while not (active / "grandchild.pid").is_file() and wrapper.poll() is None and time.monotonic() < deadline:
                    time.sleep(0.02)
                self.assertTrue((active / "grandchild.pid").is_file(), "synthetic test tree did not start")
                wrapper.send_signal(signum)
                stdout, stderr = wrapper.communicate(timeout=5)
                self.assertEqual(wrapper.returncode, 128 + signum, stderr)
                for role in ("host", "grandchild"):
                    with (active / f"{role}.lock").open("r+") as lock:
                        deadline = time.monotonic() + 2
                        while True:
                            try:
                                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                                break
                            except BlockingIOError:
                                self.assertLess(time.monotonic(), deadline, f"{role} survived cancellation")
                                time.sleep(0.02)
                verified = True
                return subprocess.CompletedProcess(command, wrapper.returncode, stdout, stderr)
            finally:
                if not verified:
                    if wrapper.poll() is None:
                        wrapper.kill()
                    # Fixture-only fallback, so a regression never leaves our test processes running.
                    for role, kill in (("host", os.killpg), ("runner", os.kill)):
                        pid_file = active / f"{role}.pid"
                        if pid_file.is_file() and (pid := pid_file.read_text(encoding="utf-8")).isdecimal():
                            try:
                                kill(int(pid), signal.SIGKILL)
                            except ProcessLookupError:
                                pass
                    wrapper.communicate(timeout=5)

    @unittest.skipUnless(os.name == "posix", "requires POSIX process groups and file locks")
    def test_wrapper_cancellation_stops_the_test_tree_and_saves_the_report(self):
        for signum in (signal.SIGTERM, signal.SIGINT):
            with self.subTest(signal=signum.name):
                completed, docker, _, report = self.invoke(cancel_signal=signum)
                self.assertEqual(completed.returncode, 128 + signum)
                self.assertEqual(docker[-2:], ["rm -f fake-container", "checkpoint saved before cleanup"])
                self.assertEqual([row["outcome"] for row in report["cases"]],
                                 ["passed", "interrupted", "not-started"])
                self.assertEqual(report["cases"][1]["interruption"], "cancelled")
                self.assertEqual(report["unreported"], 1)

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

    def test_pull_timeout_preserves_the_full_unstarted_selection(self):
        completed, docker, argv, report = self.invoke(stall="pull")
        self.assertEqual(completed.returncode, 124, completed.stderr)
        self.assertIn("fixture setup timed out", completed.stderr)
        self.assertFalse(argv)
        self.assertEqual(len(docker), 1)
        self.assertEqual(report["fixture_timeouts"], ["setup"])
        self.assertEqual([row["outcome"] for row in report["cases"]], ["not-started"] * 3)

    def test_start_timeout_attempts_cleanup_even_without_a_returned_container_id(self):
        completed, docker, argv, report = self.invoke(stall="run")
        self.assertEqual(completed.returncode, 124, completed.stderr)
        self.assertFalse(argv)
        start = next(line for line in docker if line.startswith("run ")).split()
        target = start[start.index("--name") + 1]
        self.assertEqual(docker[-1], f"rm -f {target}")
        self.assertEqual(report["fixture_timeouts"], ["setup"])

    def test_readiness_timeout_does_not_retry_after_the_setup_budget_expires(self):
        completed, docker, argv, report = self.invoke(stall="exec")
        self.assertEqual(completed.returncode, 124, completed.stderr)
        self.assertFalse(argv)
        self.assertEqual(sum(line.startswith("exec ") for line in docker), 1)
        self.assertEqual(docker[-1], "rm -f fake-container")
        self.assertEqual(report["fixture_timeouts"], ["setup"])

    def test_cleanup_timeout_preserves_passed_cases_and_fails_the_wrapper(self):
        completed, docker, _, report = self.invoke(stall="rm")
        self.assertEqual(completed.returncode, 124, completed.stderr)
        self.assertIn("fixture cleanup timed out", completed.stderr)
        self.assertEqual(docker[-1], "rm -f fake-container")
        self.assertEqual(report["fixture_timeouts"], ["cleanup"])
        self.assertEqual([row["outcome"] for row in report["cases"]], ["passed"] * 3)
        self.assertEqual(report["unreported"], 0)

    def test_cleanup_timeout_does_not_replace_an_existing_test_failure(self):
        completed, _, _, report = self.invoke(stall="rm", test_exit=1)
        self.assertEqual(completed.returncode, 1, completed.stderr)
        self.assertEqual(report["fixture_timeouts"], ["cleanup"])
        self.assertEqual([row["outcome"] for row in report["cases"]], ["passed", "failed", "passed"])

    def test_removal_error_is_success_only_if_docker_confirms_absence(self):
        completed, docker, _, report = self.invoke(cleanup_check="absent")
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(docker[-2:], ["rm -f fake-container",
                         "container ls --all --no-trunc --filter id=fake-container --format {{.ID}}"])
        self.assertEqual(report["fixture_cleanup"], "already-absent")
        self.assertEqual([row["outcome"] for row in report["cases"]], ["passed"] * 3)

    def test_failed_removal_fails_smoke_when_presence_cannot_be_ruled_out(self):
        for check, outcome in (("present", "still-present"), ("unavailable", "unverified"),
                               ("unexpected", "unverified")):
            with self.subTest(check=check):
                completed, _, _, report = self.invoke(cleanup_check=check)
                self.assertEqual(completed.returncode, 1, completed.stderr)
                self.assertEqual(report["fixture_cleanup"], outcome)
                self.assertEqual([row["outcome"] for row in report["cases"]], ["passed"] * 3)
                self.assertNotIn("unexpected-list-entry", completed.stdout + completed.stderr + json.dumps(report))

    def test_cleanup_verification_uses_the_cleanup_deadline(self):
        completed, docker, _, report = self.invoke(cleanup_check="timeout")
        self.assertEqual(completed.returncode, 124, completed.stderr)
        self.assertIn("fixture cleanup timed out", completed.stderr)
        self.assertTrue(docker[-1].startswith("container ls "))
        self.assertEqual(report["fixture_timeouts"], ["cleanup"])
        self.assertEqual(report["fixture_cleanup"], "unverified")
        self.assertEqual([row["outcome"] for row in report["cases"]], ["passed"] * 3)

    def test_confirmed_absence_does_not_mask_a_test_failure(self):
        completed, _, _, report = self.invoke(cleanup_check="absent", test_exit=1)
        self.assertEqual(completed.returncode, 1, completed.stderr)
        self.assertEqual(report["fixture_cleanup"], "already-absent")
        self.assertEqual([row["outcome"] for row in report["cases"]], ["passed", "failed", "passed"])

    def test_absence_check_uses_the_generated_name_without_a_returned_id(self):
        completed, docker, _, report = self.invoke(stall="run", cleanup_check="absent")
        self.assertEqual(completed.returncode, 124, completed.stderr)
        start = next(line for line in docker if line.startswith("run ")).split()
        target = start[start.index("--name") + 1]
        self.assertEqual(docker[-2:], [f"rm -f {target}",
                         f"container ls --all --no-trunc --filter name={target} --format {{{{.Names}}}}"])
        self.assertEqual(report["fixture_timeouts"], ["setup"])
        self.assertEqual(report["fixture_cleanup"], "already-absent")

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
