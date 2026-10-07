#!/usr/bin/env python3
"""Evergreen launcher CLI: digest a failed run, decide, then launch a Cloud Agent or open a report issue.

Subcommands are separate so the workflow can record each stage's output and so
the decision can be inspected without an API key.

    evergreen_launch.py digest --run-id 123 --output .evergreen/digest.json
    evergreen_launch.py decide --digest .evergreen/digest.json --max-per-day 6 --output .evergreen/decision.json
    evergreen_launch.py launch --digest ... --decision ... --model cursor-grok-4.6-high --output .evergreen/launch.json
    evergreen_launch.py report --digest ... --decision ... --output .evergreen/report.json
    evergreen_launch.py announce --digest ... --decision ... --launch .evergreen/launch.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_ROOT = Path(__file__).resolve().parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.cloud_agent_client import DEFAULT_MODEL, CloudAgentClient  # noqa: E402
from evergreen.failure_digest import FailureDigest, FailureDigestBuilder  # noqa: E402
from evergreen.fingerprint import FingerprintCalculator  # noqa: E402
from evergreen.github_cli import GitHubCli  # noqa: E402
from evergreen.github_state import GitHubStateReader  # noqa: E402
from evergreen.issue_reporter import IssueReporter  # noqa: E402
from evergreen.lane import Lane, parse_lanes  # noqa: E402
from evergreen.launch_announcer import LaunchAnnouncer  # noqa: E402
from evergreen.launch_policy import LaunchDecision, LaunchPolicy  # noqa: E402
from evergreen.launch_target import DeliveryMode, LaunchTarget  # noqa: E402
from evergreen.prior_work import PriorWork  # noqa: E402
from evergreen.prompt_renderer import PromptRenderer  # noqa: E402


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _append_github_output(values: dict[str, str]) -> None:
    output_path: str | None = os.environ.get("GITHUB_OUTPUT")

    if not output_path:
        return

    with open(output_path, "a", encoding="utf-8") as handle:
        for key, value in values.items():
            handle.write(f"{key}={value}\n")


def _repository(args: argparse.Namespace) -> str:
    repository: str | None = args.repository or os.environ.get("GITHUB_REPOSITORY")

    if not repository:
        raise SystemExit("--repository or GITHUB_REPOSITORY is required")

    return repository


def _now() -> datetime:
    return datetime.now(timezone.utc)


# Dependabot branches are compared against the latest run on this branch to spot trunk-wide failures.
TRUNK_BRANCH = "master"


def command_digest(args: argparse.Namespace) -> int:
    github = GitHubCli(_repository(args))
    digest: FailureDigest = FailureDigestBuilder(github).build(args.run_id)
    _write_json(Path(args.output), digest.to_dict())
    print(f"digest: {digest.workflow_name} run {digest.run_id} on {digest.head_branch}: {len(digest.failed_jobs)} failed job(s)")
    return 0


def _disabled_lanes(args: argparse.Namespace) -> frozenset[Lane]:
    try:
        return parse_lanes(args.disabled_lanes)
    except ValueError as error:
        raise SystemExit(str(error)) from error


def command_decide(args: argparse.Namespace) -> int:
    digest: FailureDigest = FailureDigest.from_dict(_read_json(Path(args.digest)))
    github = GitHubCli(_repository(args))
    state = GitHubStateReader(github)
    now: datetime = _now()
    calculator = FingerprintCalculator()
    prior: PriorWork = state.prior_work(digest.pull_request_numbers)
    policy = LaunchPolicy(max_per_day=args.max_per_day, disabled_lanes=_disabled_lanes(args))
    decision: LaunchDecision = policy.decide(
        digest=digest,
        fingerprint=calculator.compute(digest),
        family=calculator.family(digest),
        now=now,
        prior=prior,
        todays_cache_keys=state.todays_launch_cache_keys(now.date()),
        # Lazy: only Dependabot launches pay for these two extra API calls.
        trunk_failed_jobs=lambda: state.failed_job_names_on_branch(digest.workflow_name, TRUNK_BRANCH),
    )
    _write_json(Path(args.output), decision.to_dict())
    _append_github_output(
        {
            "launch": "true" if decision.launch else "false",
            "report": "true" if decision.report else "false",
            "lane": decision.lane,
            "delivery_mode": decision.delivery_mode,
            "fingerprint": decision.fingerprint,
            "cache_key": decision.cache_key,
            "reason": decision.reason,
        }
    )
    print(
        f"decision: launch={decision.launch} report={decision.report} lane={decision.lane or '-'} "
        f"fingerprint={decision.fingerprint} reason={decision.reason}"
    )
    return 0


def command_launch(args: argparse.Namespace) -> int:
    digest: FailureDigest = FailureDigest.from_dict(_read_json(Path(args.digest)))
    decision = LaunchDecision(**_read_json(Path(args.decision)))

    if not decision.launch:
        raise SystemExit(f"decision says do not launch: {decision.reason}")

    api_key: str = os.environ.get("CURSOR_API_KEY", "")
    repository: str = _repository(args)
    client = CloudAgentClient(api_key=api_key, repo_url=f"https://github.com/{repository}")
    target = LaunchTarget(
        starting_ref=decision.starting_ref,
        delivery_mode=DeliveryMode(decision.delivery_mode),
        lane=Lane(decision.lane or Lane.TRUNK_GATE.value),
    )
    prompt_text: str = PromptRenderer().render(digest, decision)
    launched = client.launch(prompt_text, args.model, target)
    _write_json(
        Path(args.output),
        {
            **launched.to_dict(),
            "fingerprint": decision.fingerprint,
            "cache_key": decision.cache_key,
            "run_url": digest.run_url,
            "launched_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    _append_github_output({"agent_url": launched.url, "agent_id": launched.agent_id})
    print(f"launched: {launched.url} (model {launched.model} -> catalog id {launched.model_id})")
    return 0


def command_report(args: argparse.Namespace) -> int:
    digest: FailureDigest = FailureDigest.from_dict(_read_json(Path(args.digest)))
    decision = LaunchDecision(**_read_json(Path(args.decision)))

    if not decision.report:
        raise SystemExit(f"decision says do not report: {decision.reason}")

    issue_url: str = IssueReporter(GitHubCli(_repository(args))).publish(digest, decision)
    _write_json(Path(args.output), {"issue_url": issue_url, "fingerprint": decision.fingerprint})
    _append_github_output({"issue_url": issue_url})
    print(f"reported: {issue_url}")
    return 0


def command_announce(args: argparse.Namespace) -> int:
    digest: FailureDigest = FailureDigest.from_dict(_read_json(Path(args.digest)))
    decision = LaunchDecision(**_read_json(Path(args.decision)))
    agent_url: str = str(_read_json(Path(args.launch))["url"])
    urls: list[str] = LaunchAnnouncer(GitHubCli(_repository(args))).announce(
        digest.pull_request_numbers, decision, agent_url
    )
    print(f"announced on {len(urls)} pull request(s)")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repository", help="owner/name; defaults to GITHUB_REPOSITORY")
    subparsers = parser.add_subparsers(dest="command", required=True)

    digest = subparsers.add_parser("digest", help="read a failed run into a digest JSON file")
    digest.add_argument("--run-id", type=int, required=True)
    digest.add_argument("--output", required=True)
    digest.set_defaults(func=command_digest)

    decide = subparsers.add_parser("decide", help="apply dedupe and daily-cap policy")
    decide.add_argument("--digest", required=True)
    decide.add_argument("--max-per-day", type=int, default=6)
    decide.add_argument("--disabled-lanes", default="", help="comma-separated lanes to skip, e.g. dependabot,scheduled")
    decide.add_argument("--output", required=True)
    decide.set_defaults(func=command_decide)

    launch = subparsers.add_parser("launch", help="post the prompt to the Cloud Agents API")
    launch.add_argument("--digest", required=True)
    launch.add_argument("--decision", required=True)
    launch.add_argument("--model", default=DEFAULT_MODEL)
    launch.add_argument("--output", required=True)
    launch.set_defaults(func=command_launch)

    report = subparsers.add_parser("report", help="open an issue for a report-only workflow failure")
    report.add_argument("--digest", required=True)
    report.add_argument("--decision", required=True)
    report.add_argument("--output", required=True)
    report.set_defaults(func=command_report)

    announce = subparsers.add_parser("announce", help="comment the fingerprint on the pull request an agent was launched onto")
    announce.add_argument("--digest", required=True)
    announce.add_argument("--decision", required=True)
    announce.add_argument("--launch", required=True, help="launch.json written by the launch subcommand")
    announce.set_defaults(func=command_announce)

    return parser


def main(argv: list[str] | None = None) -> int:
    args: argparse.Namespace = build_parser().parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    sys.exit(main())
