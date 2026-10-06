"""Reduce a failure digest to a stable root-cause key used for dedupe."""

from __future__ import annotations

import hashlib
import re

from evergreen.failure_digest import FailedJob, FailureDigest

# Compiler / analyzer diagnostics such as ``error ARCH006:`` or ``error TS2345:``.
_DIAGNOSTIC_CODE = re.compile(r"\berror\s+([A-Z]{2,}\d{3,})\b")
# gitleaks reports the matched rule on its own line.
_GITLEAKS_RULE = re.compile(r"^RuleID:\s+(\S+)", re.IGNORECASE)
# Volatile fragments that would otherwise make every run look like a new root cause.
_RUNNER_PATH = re.compile(r"/home/runner/work/[^/]+/[^/]+/")
_HEX_SHA = re.compile(r"\b[0-9a-f]{7,40}\b")
# Log-line clocks such as "11:40AM" or "13:05:22.123"; the AM/PM marker alone would otherwise split keys.
_CLOCK = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:\s*[AP]M\b)?", re.IGNORECASE)
_NUMBERS = re.compile(r"\d+")


class FingerprintCalculator:
    """Hash workflow, branch, and per-job breakage signatures.

    A signature is the diagnostic code (``ARCH006``, ``TS2345``, a gitleaks rule
    id) when one is present, otherwise the normalised text of an error line.
    Signatures are a sorted, de-duplicated set so that parallel build output
    arriving in a different order, or the same error in more files, still maps
    to the same key. Two unrelated errors in one job collapse together on
    purpose: one agent repairs that job either way.
    """

    def __init__(self, max_signatures_per_job: int = 10, digest_length: int = 12) -> None:
        if max_signatures_per_job <= 0 or digest_length <= 0:
            raise ValueError("max_signatures_per_job and digest_length must be positive")

        self._max_signatures_per_job = max_signatures_per_job
        self._digest_length = digest_length

    def compute(self, digest: FailureDigest) -> str:
        parts: list[str] = [digest.workflow_name, digest.head_branch]

        for job in sorted(digest.failed_jobs, key=lambda failed: failed.name):
            parts.append(f"job:{job.name}")
            parts.extend(f"step:{step}" for step in job.failed_steps)
            parts.extend(f"sig:{signature}" for signature in self.job_signatures(job))

        material: str = "\n".join(parts)
        return hashlib.sha256(material.encode("utf-8")).hexdigest()[: self._digest_length]

    def job_signatures(self, job: FailedJob) -> list[str]:
        signatures: set[str] = {self.signature(line) for line in job.error_lines}
        signatures.discard("")
        return sorted(signatures)[: self._max_signatures_per_job]

    @staticmethod
    def signature(line: str) -> str:
        code = _DIAGNOSTIC_CODE.search(line)

        if code:
            return f"code:{code.group(1)}"

        rule = _GITLEAKS_RULE.match(line.strip())

        if rule:
            return f"rule:{rule.group(1).lower()}"

        return FingerprintCalculator.normalise(line)

    @staticmethod
    def normalise(line: str) -> str:
        without_paths: str = _RUNNER_PATH.sub("", line)
        without_clocks: str = _CLOCK.sub("TIME", without_paths)
        without_shas: str = _HEX_SHA.sub("SHA", without_clocks)
        return _NUMBERS.sub("N", without_shas).strip().lower()
