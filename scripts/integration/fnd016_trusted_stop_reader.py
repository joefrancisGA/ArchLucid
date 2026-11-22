"""FND-016 trusted SQL emergency-stop reader.

Read-only, independently provisioned SQL principal. An absent row or any
database error is a stop condition. No mutation or execution capability.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Callable

from scripts.integration.fnd016_recovery_stop_gate import StopSnapshot


def read_stop_snapshot(
    tenant_id: str, project_id: str,
    query: Callable[[str, tuple[str, str]], list[tuple[object, ...]]],
    *,
    observed_at: datetime,
) -> StopSnapshot:
    def stopped() -> StopSnapshot:
        return StopSnapshot(tenant_id, project_id, True, 0, observed_at, False)
    if not tenant_id or not project_id or observed_at.tzinfo is None:
        return stopped()
    try:
        # The query adapter must execute parameterized SQL under a read-only
        # identity; tenant/project values must never be interpolated.
        rows = query(
            "SELECT StopActive, Generation FROM dbo.RemediationEmergencyStop "
            "WHERE TenantId=? AND ProjectId=?",
            (tenant_id, project_id),
        )
        if len(rows) != 1:
            return stopped()
        active, generation = rows[0]
        if type(active) not in (bool, int) or active not in (0, 1):
            return stopped()
        if type(generation) is not int or generation < 1:
            return stopped()
        return StopSnapshot(tenant_id, project_id, bool(active),
                            generation, observed_at, True)
    except Exception:
        return stopped()
