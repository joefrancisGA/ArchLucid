"""Chapter 13 listings: audit records, cache keys, and token budgets.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch13_governance.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region audit_record
import hashlib
import json
import re

# Fields an audit record may contain. Anything else is rejected, so content can't creep in.
AUDIT_FIELDS = frozenset({
    "correlationId", "tenantId", "snapshotId", "packBuilderVersion", "packSha256",
    "audience", "promptTemplateVersion", "modelDeployment", "modelVersion",
    "validatorVersion", "validatorProblems", "attempt", "outputSha256",
    "inputTokens", "outputTokens", "reviewer", "decision", "contentRetained", "atUtc",
})
COUNT_FIELDS = frozenset({"validatorProblems", "attempt", "inputTokens", "outputTokens"})
HASH_FIELDS = frozenset({"packSha256", "outputSha256"})
FLAG_FIELDS = frozenset({"contentRetained"})
DECISIONS = frozenset({"approved", "rejected", "pending"})
# Every other field is an identifier, version, or timestamp:
# short and without spaces, so prose can't fit.
IDENTIFIER = re.compile(r"[A-Za-z0-9._:@/+-]{1,128}")
SHA256_HEX = re.compile(r"[0-9a-f]{64}")


def sha256_of(value: object) -> str:
    """Stable hash of a JSON-serializable value: same content, same hash, whatever the key order."""
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def audit_value_problem(name: str, value: object) -> str | None:
    """Return why a value doesn't fit its field, or None if it does."""
    if name in COUNT_FIELDS:
        # bool is a subclass of int in Python, so exclude it explicitly.
        ok = isinstance(value, int) and not isinstance(value, bool) and value >= 0
        return None if ok else "must be a non-negative integer"

    if name in FLAG_FIELDS:
        return None if isinstance(value, bool) else "must be true or false"

    if not isinstance(value, str):
        return "must be a string"

    if name in HASH_FIELDS:
        return None if SHA256_HEX.fullmatch(value) else "must be a SHA-256 hex digest"

    if name == "decision":
        return None if value in DECISIONS else f"must be one of {', '.join(sorted(DECISIONS))}"

    return None if IDENTIFIER.fullmatch(value) else "must be a short identifier with no spaces"


def audit_record(**fields: object) -> dict:
    """Build an audit record.

    Unknown fields and free-text values raise, so a prompt or a draft can't be logged by accident.
    """
    unknown = sorted(set(fields) - AUDIT_FIELDS)

    if unknown:
        raise ValueError(f"not allowed in an audit record: {', '.join(unknown)}")

    problems = [
        f"{name} {problem}"
        for name, value in fields.items()
        if (problem := audit_value_problem(name, value))
    ]

    if problems:
        raise ValueError("; ".join(problems))

    return dict(fields)
# endregion audit_record


# region audit_record_example
record = audit_record(
    correlationId="run-2026-10-20-0412",
    tenantId="contoso",
    snapshotId="2026-10-20T14-02-00Z-prod",
    packBuilderVersion="pack-builder-1.6.0",
    packSha256=sha256_of({"packId": "contoso-payments-2026-10-20", "items": ["..."]}),
    audience="board",
    promptTemplateVersion="board-summary-v4",
    modelDeployment="explain-prod",
    modelVersion="2026-08-06",
    validatorVersion="validator-2.3.1",
    validatorProblems=0,
    attempt=1,
    outputSha256=sha256_of({"sentences": ["..."]}),
    inputTokens=2140,
    outputTokens=312,
    reviewer="user:security-architect-02",
    decision="approved",
    contentRetained=False,
    atUtc="2026-10-20T15:11:09Z",
)
# endregion audit_record_example


# region explanation_cache_key
def explanation_cache_key(
    tenant_id: str,
    pack_sha256: str,
    audience: str,
    prompt_version: str,
    model_version: str,
    validator_version: str,
) -> str:
    """Every input and policy version governing a cached explanation is part of the key."""
    parts = [tenant_id, pack_sha256, audience, prompt_version, model_version, validator_version]

    if any(not part for part in parts):
        raise ValueError("every cache key part is required")

    return "explain:" + ":".join(f"{len(part)}:{part}" for part in parts)
# endregion explanation_cache_key


# region token_budget
class TokenBudget:
    """Tracks token use for one run.

    Reserves each call's worst case first, so the limit can't be overshot.
    """

    def __init__(self, limit: int) -> None:
        if limit <= 0:
            raise ValueError("limit must be positive")

        self.limit = limit
        self.used = 0
        self.reserved = 0

    def reserve(self, input_tokens: int, max_output_tokens: int) -> int | None:
        """Reserve the most a call can use.

        Returns the reservation, or None if the call must not be made.
        """
        if input_tokens < 0 or max_output_tokens <= 0:
            raise ValueError("token counts must be positive")

        worst_case = input_tokens + max_output_tokens

        if self.used + self.reserved + worst_case > self.limit:
            return None

        self.reserved += worst_case

        return worst_case

    def settle(self, reservation: int, actual_tokens: int) -> None:
        """Replace a reservation with the usage the response reported."""
        self.reserved -= reservation
        self.used += actual_tokens

        if actual_tokens > reservation:
            raise RuntimeError("usage exceeded the reservation; the output cap was not enforced")
# endregion token_budget
