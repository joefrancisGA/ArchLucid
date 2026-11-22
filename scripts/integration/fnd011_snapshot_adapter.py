"""FND-011 read-only adapter for an already-authorized persisted GraphSnapshot.

This is a pure conversion boundary. Callers MUST perform the existing
GraphController scoped lookup, sealed-manifest and size guards first.
No network, filesystem or mutation operations occur here.
"""
from datetime import datetime, timezone


def _utc(value):
    if not isinstance(value, str):
        raise ValueError("A timestamp is required")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Timestamp must include UTC offset")
    return parsed.astimezone(timezone.utc)


def adapt_authorized_snapshot(
    graph, *, authorized_scope, expected_run_id, evaluated_at,
    max_age_seconds=None, source_evidence_refs=(),
):
    """Project a trusted GraphSnapshot into the FND-011 exchange envelope.

    authorized_scope is a server-authenticated scope, never request-body input.
    Unknown provenance remains an empty list; it is never fabricated.
    """
    if not isinstance(graph, dict) or not isinstance(authorized_scope, dict):
        raise ValueError("Trusted graph and scope are required")
    for field in ("tenantId", "workspaceId", "projectId"):
        if not authorized_scope.get(field):
            raise ValueError("Missing authenticated scope: " + field)
    if not expected_run_id or graph.get("runId") != expected_run_id:
        raise ValueError("Run identity mismatch")
    for field in ("graphSnapshotId", "contextSnapshotId", "createdUtc"):
        if not graph.get(field):
            raise ValueError("Missing persisted graph field: " + field)
    if graph.get("schemaVersion") != 1:
        raise ValueError("Unsupported persisted graph version")
    captured = _utc(graph["createdUtc"])
    now = _utc(evaluated_at)
    if now < captured:
        raise ValueError("Evaluation predates snapshot")
    if max_age_seconds is not None and (isinstance(max_age_seconds, bool) or
                                        not isinstance(max_age_seconds, int) or max_age_seconds < 0):
        raise ValueError("Invalid freshness policy")
    status = ("unknown" if max_age_seconds is None else
              "current" if (now - captured).total_seconds() <= max_age_seconds else "stale")
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    node_ids = {n["nodeId"] for n in nodes}
    if len(node_ids) != len(nodes):
        raise ValueError("Duplicate graph node IDs")
    if any(e.get("fromNodeId") not in node_ids or e.get("toNodeId") not in node_ids for e in edges):
        raise ValueError("Dangling graph edge")
    return {
        "schemaVersion": "1.0.0",
        **{k: authorized_scope[k] for k in ("tenantId", "workspaceId", "projectId")},
        "runId": expected_run_id,
        "graphSnapshotId": graph["graphSnapshotId"],
        "sourceGraphSchemaVersion": graph["schemaVersion"],
        "capturedAt": captured.isoformat().replace("+00:00", "Z"),
        "freshness": {"evaluatedAt": now.isoformat().replace("+00:00", "Z"), "status": status},
        "lineage": {"contextSnapshotId": graph["contextSnapshotId"],
                    "sourceEvidenceRefs": list(source_evidence_refs)},
        "nodes": [{"nodeId": n["nodeId"], "nodeType": n["nodeType"],
                   "evidenceRefs": []} for n in nodes],
        "edges": [{"fromNodeId": e["fromNodeId"], "toNodeId": e["toNodeId"],
                   "edgeType": e["edgeType"], "evidenceRefs": []} for e in edges],
        "readOnly": True,
        "warnings": list(graph.get("warnings") or []),
    }
