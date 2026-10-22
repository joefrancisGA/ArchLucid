"""Resolve an allowlisted Evergreen model slug onto an entry from GET /v1/models.

The allowlist uses Cursor-internal slugs (for example ``cursor-grok-4.6-high``), while the public
Cloud Agents API only accepts catalog ids plus per-model params (for example a base id with a
reasoning-effort param). Resolution never enables a fast tier.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

_INTERNAL_PREFIX = "cursor-"
_EFFORT_SUFFIXES: tuple[str, ...] = ("xhigh", "high", "medium", "low")
_FAST_PARAM_ID = "fast"


@dataclass(frozen=True)
class ModelSelection:
    id: str
    params: list[dict[str, str]] = field(default_factory=list)

    def to_payload(self) -> dict[str, Any]:
        return {"id": self.id, "params": [dict(p) for p in self.params]}


def resolve_model(requested: str, catalog: dict[str, Any]) -> ModelSelection:
    items: list[dict[str, Any]] = list(catalog.get("items") or [])

    for candidate, effort in _candidates(requested):
        item: dict[str, Any] | None = _find_item(items, candidate)

        if item is None:
            continue

        return _select(item, requested, effort)

    available: list[str] = sorted(str(i.get("id")) for i in items if i.get("id"))
    raise ValueError(f"model '{requested}' is not in the Cloud Agents catalog; available ids: {available}")


def _candidates(requested: str) -> list[tuple[str, str | None]]:
    """Ordered (catalog name, effort to apply) pairs: exact slug first, then progressively looser forms."""
    names: list[str] = [requested]

    if requested.startswith(_INTERNAL_PREFIX):
        names.append(requested[len(_INTERNAL_PREFIX):])

    result: list[tuple[str, str | None]] = [(name, None) for name in names]

    for name in names:
        for suffix in _EFFORT_SUFFIXES:
            if name.endswith(f"-{suffix}"):
                result.append((name[: -len(suffix) - 1], suffix))
                break

    return result


def _find_item(items: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    for item in items:
        names: set[str] = {str(item.get("id", ""))} | {str(a) for a in item.get("aliases") or []}

        if name in names:
            return item

    return None


def _select(item: dict[str, Any], requested: str, effort: str | None) -> ModelSelection:
    parameters: list[dict[str, Any]] = list(item.get("parameters") or [])
    params: list[dict[str, str]] = []

    if effort is not None:
        effort_param: str | None = _parameter_accepting(parameters, effort, exclude=_FAST_PARAM_ID)

        if effort_param is None:
            raise ValueError(f"model '{item.get('id')}' has no parameter accepting '{effort}' (requested '{requested}')")

        params.append({"id": effort_param, "value": effort})

    if any(p.get("id") == _FAST_PARAM_ID for p in parameters):
        params.append({"id": _FAST_PARAM_ID, "value": "false"})

    selection = ModelSelection(id=str(item["id"]), params=params)
    _require_listed_variant(item, selection)
    return selection


def _parameter_accepting(parameters: list[dict[str, Any]], value: str, exclude: str) -> str | None:
    for parameter in parameters:
        if parameter.get("id") == exclude:
            continue

        values: set[str] = {str(v.get("value")) for v in parameter.get("values") or []}

        if value in values:
            return str(parameter.get("id"))

    return None


def _require_listed_variant(item: dict[str, Any], selection: ModelSelection) -> None:
    """When the catalog lists concrete variants, the chosen params must be one of them."""
    variants: list[dict[str, Any]] = list(item.get("variants") or [])

    if not variants:
        return

    chosen: set[tuple[str, str]] = {(p["id"], p["value"]) for p in selection.params}

    for variant in variants:
        offered: set[tuple[str, str]] = {(str(p.get("id")), str(p.get("value"))) for p in variant.get("params") or []}

        if offered == chosen:
            return

    raise ValueError(f"model '{selection.id}' does not offer params {sorted(chosen)}; variants: {variants}")
