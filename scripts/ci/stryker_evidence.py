#!/usr/bin/env python3
"""One Stryker.NET 4.16.0 scoring and run-evidence contract for CI and Aspects."""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import signal
import subprocess
import sys

VERSION = "4.16.0"
SCHEMA = "2"
STATUSES = ("Killed", "Survived", "NoCoverage", "Timeout", "CompileError", "RuntimeError", "Ignored", "Pending")
SHA = re.compile(r"[a-f0-9]{40}")
DIGEST = re.compile(r"[a-f0-9]{64}")
RECEIPT = "run-evidence.json"
# The pinned CLI reports percentages to two decimal places.
DISPLAY_TOLERANCE = 0.00500001


def reject_duplicates(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def reject_constant(_text: str) -> None:
    raise ValueError("nonfinite JSON number")


def read_json(raw: bytes) -> dict:
    value = json.loads(raw, object_pairs_hook=reject_duplicates, parse_constant=reject_constant)
    if not isinstance(value, dict):
        raise ValueError("expected a JSON object")
    return value


def percent(value: object) -> float:
    if type(value) not in (int, float) or not (0 <= value <= 100) or not math.isfinite(value):
        raise ValueError("expected a finite percentage in [0, 100]")
    return float(value)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def clean_path(value: str) -> PurePosixPath:
    if not isinstance(value, str) or not value or not value.strip() or "\x00" in value:
        raise ValueError("invalid report path")
    path = PurePosixPath(value.replace("\\", "/"))
    if ".." in path.parts or not path.parts:
        raise ValueError("invalid report path")
    return path


def official_score(counts: dict) -> tuple[float | None, int, int]:
    # Tagged ProjectComponent.cs: valid = detected (Killed/Timeout) plus
    # undetected (Survived/NoCoverage); compile/runtime errors are invalid.
    detected = counts.get("Killed", 0) + counts.get("Timeout", 0)
    denominator = detected + counts.get("Survived", 0) + counts.get("NoCoverage", 0)
    return (100 * detected / denominator if denominator else None, detected, denominator)


def inventory(report: dict) -> dict:
    if report.get("schemaVersion") != SCHEMA or not isinstance(report.get("files"), dict):
        raise ValueError("expected the Stryker.NET 4.16.0 schema 2 files inventory")
    project_root = clean_path(report.get("projectRoot"))
    counts = Counter()
    paths = set()
    candidates = []
    since_ignored = 0
    auxiliary_files = 0
    for original, node in sorted(report["files"].items()):
        path = clean_path(original)
        if path in paths:
            raise ValueError("duplicate canonical report path")
        paths.add(path)
        if not isinstance(node, dict) or not isinstance(node.get("mutants"), list):
            raise ValueError("invalid mutant inventory for a source file")
        if not path.is_relative_to(project_root) or path == project_root:
            if node["mutants"]:
                raise ValueError("mutants were reported outside the pinned project root")
            # Stryker can list shared build sources outside the project.
            # Their empty inventories cannot contribute to either denominator.
            auxiliary_files += 1
        ids = set()
        for mutant in node["mutants"]:
            if not isinstance(mutant, dict) or not isinstance(mutant.get("status"), str) or not re.fullmatch(
                r"(0|[1-9][0-9]*)", mutant.get("id") if isinstance(mutant.get("id"), str) else "",
            ):
                raise ValueError("invalid mutant ID or status")
            identity = mutant["id"]
            if identity in ids:
                raise ValueError("duplicate mutant identity within a source file")
            ids.add(identity)
            status = mutant["status"]
            counts[status if status in STATUSES else "Unknown"] += 1
            if status == "Ignored" and mutant.get("statusReason") == "Removed by since filter":
                since_ignored += 1
            if status in {"Survived", "NoCoverage"}:
                candidates.append({"path": original, "id": identity, "status": status,
                                   "mutator": mutant.get("mutatorName"), "location": mutant.get("location")})
    complete = not (counts["Pending"] or counts["Unknown"])
    score, detected, denominator = official_score(counts)
    if "mutationScore" in report:
        embedded = percent(report["mutationScore"])
        if not complete or score is None or abs(score - embedded) > DISPLAY_TOLERANCE:
            raise ValueError("report-level mutation score conflicts with the status inventory")
    # Per-file/other nested scores are not project-wide evidence.
    killed, survived, uncovered = (counts[k] for k in ("Killed", "Survived", "NoCoverage"))
    tested = killed + survived
    return {
        "status_counts": dict(sorted(counts.items())),
        "mutant_count": sum(counts.values()),
        "auxiliary_files_without_mutants": auxiliary_files,
        "official_score_percent": score if complete else None,
        "official_detected_count": detected,
        "official_denominator": denominator,
        "complete_status_inventory": complete,
        "assertion_kill_percent": 100 * killed / tested if tested and complete else None,
        "coverage_inclusive_kill_percent": (
            100 * killed / (tested + uncovered) if tested + uncovered and complete else None),
        "equivalent_count": None,  # v4.16.0 has no equivalent status; never guess.
        "since_filtered_ignored_count": since_ignored,
        "survivor_candidates": candidates,
    }


def report_path(root: Path) -> Path:
    paths = list(root.rglob("mutation-report.json")) if root.is_dir() else []
    if len(paths) != 1 or paths[0].is_symlink() or not paths[0].resolve().is_relative_to(root.resolve()):
        raise ValueError("expected exactly one mutation-report.json inside the run directory")
    return paths[0]


def git(repo: Path, *args: str) -> bytes:
    result = subprocess.run(["git", *args], cwd=repo, capture_output=True, check=False, timeout=30)
    if result.returncode != 0:
        raise ValueError("Git could not verify the pinned mutation input")
    return result.stdout


def head_revision(repo: Path) -> str:
    return git(repo, "rev-parse", "HEAD").decode("ascii").strip()


def validate_revision(value: str) -> str:
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise ValueError("expected a full lowercase Git revision")
    return value


def pinned_config(repo: Path, head: str, config: str) -> tuple[bytes, str]:
    relative = clean_path(config)
    if relative.is_absolute() or ":" in relative.as_posix():
        raise ValueError("expected a repository-relative Stryker configuration")
    raw = git(repo, "show", f"{validate_revision(head)}:{relative.as_posix()}")
    cfg = read_json(raw).get("stryker-config")
    if not isinstance(cfg, dict) or not isinstance(cfg.get("reporters"), list) or "json" not in cfg["reporters"]:
        raise ValueError("pinned Stryker configuration must enable JSON output")
    project = clean_path(cfg.get("project"))
    if project.is_absolute() or ":" in project.as_posix() or project.suffix != ".csproj":
        raise ValueError("pinned configuration must name a repository-relative project")
    return raw, project.parent.as_posix()


def validate_run(report: Path, receipt: dict, *, head: str, target: str, config_sha: str,
                 project_dir: str, base: str | None = None) -> dict:
    for key, expected in {
        "schema_version": 1, "tool_version": VERSION, "head": validate_revision(head), "target": target,
        "config_sha256": config_sha, "project_dir": project_dir, "base": base, "exit_code": 0,
    }.items():
        if key not in receipt or type(receipt[key]) is not type(expected) or receipt[key] != expected:
            raise ValueError(f"run evidence does not match expected {key}")
    if not DIGEST.fullmatch(config_sha):
        raise ValueError("invalid configuration digest")
    if base is not None:
        validate_revision(base)
        if base == head:
            raise ValueError("differential baseline must differ from the head")
    if type(receipt.get("initial_tests_found")) is not int or receipt["initial_tests_found"] < 1:
        raise ValueError("run did not establish a nonempty initial test discovery")
    raw = report.read_bytes()
    if receipt.get("report_sha256") != digest(raw):
        raise ValueError("mutation report digest does not match run evidence")
    data = read_json(raw)
    evidence = inventory(data)
    root = clean_path(data["projectRoot"])
    directory = PurePosixPath(project_dir)
    if not directory.parts or tuple(root.parts[-len(directory.parts):]) != directory.parts:
        raise ValueError("mutation report project root does not match the pinned target")
    if type(receipt.get("mutants_created")) is not int or receipt["mutants_created"] != evidence["mutant_count"]:
        raise ValueError("report inventory does not reconcile with the runner's created mutant count")
    if not evidence["complete_status_inventory"]:
        raise ValueError("pending or unknown mutants make this run incomplete")
    if "tool_score_percent" not in receipt:
        raise ValueError("run is missing the official score or no-score observation")
    score = evidence["official_score_percent"]
    tool_score = receipt["tool_score_percent"]
    if score is not None:
        if abs(percent(tool_score) - score) > DISPLAY_TOLERANCE:
            raise ValueError("official CLI score conflicts with the report calculation")
        evidence["status"] = "scored"
    elif (base is not None and tool_score is None
          and evidence["mutant_count"] == evidence["since_filtered_ignored_count"]):
        evidence["status"] = "no-in-scope-mutants"
    else:
        raise ValueError("unexplained zero official denominator; not verified evidence")
    return evidence


def console_observations(text: str) -> dict:
    text = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", text)
    versions = re.findall(r"^\s*Version:\s*(\d+\.\d+\.\d+)(?:\+[^\s]+)?\s*$", text, re.M)
    created = re.findall(r"\b(\d+) mutants created\b", text)
    discovered = re.findall(r"Number of tests found: (\d+) for project ", text)
    scores = re.findall(r"The final mutation score is (\d+(?:\.\d+)?)\s*%", text)
    no_score = text.count("Stryker was unable to calculate a mutation score")
    if (versions != [VERSION] or len(created) != 1 or not discovered or any(int(n) < 1 for n in discovered)
            or len(scores) + no_score != 1):
        raise ValueError("missing or ambiguous Stryker version, run-completion, or test inventory evidence")
    return {"tool_version": VERSION, "mutants_created": int(created[0]),
            "initial_tests_found": sum(map(int, discovered)),
            "tool_score_percent": percent(float(scores[0])) if scores else None}


def run_and_stamp(repo: Path, output: Path, *, head: str, target: str, config: str,
                  base: str | None = None, solution: str | None = None, budget: int = 21300) -> dict:
    repo = repo.resolve()
    output = output.resolve()
    if head_revision(repo) != validate_revision(head) or git(repo, "status", "--porcelain"):
        raise ValueError("mutation execution requires a clean checkout at the pinned revision")
    raw_config, project_dir = pinned_config(repo, head, config)
    if (repo / config).read_bytes() != raw_config:
        raise ValueError("working Stryker configuration does not match the pinned revision")
    pin = read_json(git(repo, "show", f"{head}:.config/dotnet-tools.json"))
    if pin.get("tools", {}).get("dotnet-stryker", {}).get("version") != VERSION:
        raise ValueError("checked-in tool pin is not the supported Stryker.NET version")
    if not 1 <= budget <= 21300:
        raise ValueError("mutation execution budget must be between 1 and 21300 seconds")
    if base is not None:
        validate_revision(base)
        if base == head or git(repo, "rev-parse", f"{base}^{{commit}}").decode().strip() != base:
            raise ValueError("differential baseline is not a distinct available commit")
    output.mkdir(parents=True, exist_ok=False)  # Never search an old run.
    command = ["dotnet", "dotnet-stryker", "-f", config, "--output", str(output),
               "--break-on-initial-test-failure", "--verbosity", "info"]
    if solution:
        command.extend(["-s", solution])
    if base:
        command.append(f"--since:{base}")
    console = output / "stryker-console.log"
    with console.open("wb") as log:
        with subprocess.Popen(command, cwd=repo, stdout=log, stderr=subprocess.STDOUT,
                              env=os.environ | {"LC_ALL": "C.UTF-8", "DOTNET_CLI_UI_LANGUAGE": "en-US"},
                              start_new_session=os.name == "posix") as child:
            try:
                status = child.wait(timeout=budget)
            except (subprocess.TimeoutExpired, KeyboardInterrupt):
                if os.name == "posix":
                    try:
                        os.killpg(child.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                else:
                    child.kill()
                raise
    if status != 0:
        raise ValueError("Stryker did not complete successfully; see the run log")
    if head_revision(repo) != head or git(repo, "diff", "HEAD", "--name-only"):
        raise ValueError("pinned checkout changed during mutation execution")
    observations = console_observations(console.read_text(encoding="utf-8"))
    report = report_path(output)
    on_disk = read_json(report.read_bytes())
    if clean_path(on_disk.get("projectRoot")) != clean_path((repo / project_dir).as_posix()):
        raise ValueError("Stryker produced a report for a different checked-out project")
    receipt = {"schema_version": 1, "head": head, "target": target, "config_sha256": digest(raw_config),
               "project_dir": project_dir, "base": base, "exit_code": status,
               "report_sha256": digest(report.read_bytes()), **observations}
    evidence = validate_run(report, receipt, head=head, target=target, config_sha=digest(raw_config),
                            project_dir=project_dir, base=base)
    (output / RECEIPT).write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return evidence


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--head", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--base")
    parser.add_argument("--solution")
    parser.add_argument("--budget-seconds", type=int, default=21300)
    args = parser.parse_args(argv)
    try:
        result = run_and_stamp(args.repo_root, args.output, head=args.head, target=args.target, config=args.config,
                               base=args.base, solution=args.solution, budget=args.budget_seconds)
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"Mutation evidence not verified: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({k: v for k, v in result.items() if k != "survivor_candidates"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
