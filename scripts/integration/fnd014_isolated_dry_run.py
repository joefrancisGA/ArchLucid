"""FND-014 deterministic remediation dry-run over an isolated in-memory model.

No arbitrary commands, shell, filesystem, network, cloud SDK, credentials or
production state access. This is a simulation boundary, NOT an OS sandbox.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
from typing import Mapping, Sequence


@dataclass(frozen=True)
class DryRunAuthorization:
    principal_id: str
    tenant_id: str
    project_id: str
    proposal_id: str
    action: str
    allowed: bool
    decision_id: str


@dataclass(frozen=True)
class RemediationStep:
    operation: str
    resource_id: str
    key: str
    expected_value: str | None
    new_value: str | None


@dataclass(frozen=True)
class DryRunResult:
    status: str
    reasons: tuple[str, ...]
    decision_id: str | None
    original_digest: str
    simulated_digest: str | None
    changes: tuple[tuple[str, str, str | None, str | None], ...]


def _digest(model: Mapping[str, Mapping[str, str]]) -> str:
    encoded = json.dumps(model, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def simulate_remediation(
    source: Mapping[str, Mapping[str, str]],
    steps: Sequence[RemediationStep],
    *,
    principal_id: str,
    tenant_id: str,
    project_id: str,
    proposal_id: str,
    decision: DryRunAuthorization,
    max_steps: int = 100,
    max_resources: int = 1000,
) -> DryRunResult:
    """Fail closed and simulate changes in a private copy only.

    Operations are an exact allowlist; preconditions prevent stale plans from
    producing optimistic results. No production writes or command execution.
    """
    original = _digest(source)
    def reject(reason: str) -> DryRunResult:
        return DryRunResult("rejected", (reason,), decision.decision_id or None,
                            original, None, ())
    if not all((principal_id, tenant_id, project_id, proposal_id)):
        return reject("missing_scope")
    if (not decision.allowed or decision.action != "remediation.simulate"
        or not decision.decision_id or decision.principal_id != principal_id
        or decision.tenant_id != tenant_id or decision.project_id != project_id
        or decision.proposal_id != proposal_id):
        return reject("not_authorized")
    if len(steps) > max_steps or len(source) > max_resources:
        return reject("resource_limit")
    if any(not isinstance(resource, str) or not resource or
           not isinstance(properties, Mapping) or
           any(not isinstance(k, str) or not isinstance(v, str)
               for k, v in properties.items())
           for resource, properties in source.items()):
        return reject("invalid_model")
    working = {rid: dict(props) for rid, props in source.items()}
    changes: list[tuple[str, str, str | None, str | None]] = []
    for step in steps:
        if step.operation not in ("set-property", "remove-property"):
            return reject("unsupported_operation")
        if not step.resource_id or not step.key or step.resource_id not in working:
            return reject("unknown_resource_or_key")
        current = working[step.resource_id].get(step.key)
        if current != step.expected_value:
            return reject("precondition_failed")
        if step.operation == "set-property":
            if not isinstance(step.new_value, str):
                return reject("invalid_new_value")
            working[step.resource_id][step.key] = step.new_value
        else:
            if step.new_value is not None or step.key not in working[step.resource_id]:
                return reject("invalid_remove")
            del working[step.resource_id][step.key]
        changes.append((step.resource_id, step.key, current, step.new_value))
    return DryRunResult("simulated", (), decision.decision_id, original,
                        _digest(working), tuple(changes))
