"""Build a compact description of a failed GitHub Actions run."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from evergreen.error_excerpt import ErrorExcerptExtractor
from evergreen.github_cli import GitHubCli

# Job conclusions that are not failures and must not be surfaced as root causes.
_NON_FAILURE_CONCLUSIONS = {"success", "skipped", "neutral", "cancelled", None}


@dataclass(frozen=True)
class FailedJob:
    name: str
    failed_steps: list[str]
    error_lines: list[str]
    url: str


@dataclass(frozen=True)
class FailureDigest:
    repository: str
    workflow_name: str
    run_id: int
    run_url: str
    event: str
    conclusion: str
    head_branch: str
    head_sha: str
    pull_request_numbers: list[int] = field(default_factory=list)
    failed_jobs: list[FailedJob] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @staticmethod
    def from_dict(data: dict[str, Any]) -> "FailureDigest":
        jobs: list[FailedJob] = [FailedJob(**job) for job in data.get("failed_jobs", [])]
        return FailureDigest(
            repository=data["repository"],
            workflow_name=data["workflow_name"],
            run_id=int(data["run_id"]),
            run_url=data["run_url"],
            event=data["event"],
            conclusion=data["conclusion"],
            head_branch=data["head_branch"],
            head_sha=data["head_sha"],
            pull_request_numbers=[int(n) for n in data.get("pull_request_numbers", [])],
            failed_jobs=jobs,
        )


class FailureDigestBuilder:
    """Read a run, its jobs, and the failed jobs' logs through the GitHub API."""

    def __init__(self, github: GitHubCli, extractor: ErrorExcerptExtractor | None = None) -> None:
        self._github = github
        self._extractor = extractor or ErrorExcerptExtractor()

    def build(self, run_id: int) -> FailureDigest:
        run: dict[str, Any] = self._github.api_json(self._github.repo_path(f"actions/runs/{run_id}"))
        jobs_payload: dict[str, Any] = self._github.api_json(
            self._github.repo_path(f"actions/runs/{run_id}/jobs?per_page=100")
        )
        failed_jobs: list[FailedJob] = [
            self._describe_job(job)
            for job in jobs_payload.get("jobs", [])
            if job.get("conclusion") not in _NON_FAILURE_CONCLUSIONS
        ]

        return FailureDigest(
            repository=self._github.repository,
            workflow_name=str(run.get("name") or ""),
            run_id=int(run["id"]),
            run_url=str(run.get("html_url") or ""),
            event=str(run.get("event") or ""),
            conclusion=str(run.get("conclusion") or ""),
            head_branch=str(run.get("head_branch") or ""),
            head_sha=str(run.get("head_sha") or ""),
            pull_request_numbers=[int(pr["number"]) for pr in run.get("pull_requests") or []],
            failed_jobs=failed_jobs,
        )

    def _describe_job(self, job: dict[str, Any]) -> FailedJob:
        failed_steps: list[str] = [
            str(step.get("name") or "")
            for step in job.get("steps") or []
            if step.get("conclusion") not in _NON_FAILURE_CONCLUSIONS
        ]
        return FailedJob(
            name=str(job.get("name") or ""),
            failed_steps=failed_steps,
            error_lines=self._read_error_lines(int(job["id"])),
            url=str(job.get("html_url") or ""),
        )

    def _read_error_lines(self, job_id: int) -> list[str]:
        # Logs are optional context: a missing or expired log must not block the launch.
        try:
            log_text: str = self._github.api_text(self._github.repo_path(f"actions/jobs/{job_id}/logs"))
        except RuntimeError:
            return []

        return self._extractor.extract(log_text)
