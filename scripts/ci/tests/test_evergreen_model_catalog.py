"""Unit tests for evergreen.model_catalog."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from typing import Any

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.model_catalog import ModelSelection, resolve_model  # noqa: E402

_FAST = {"id": "fast", "values": [{"value": "false"}, {"value": "true"}]}
_EFFORT = {"id": "reasoning", "values": [{"value": "low"}, {"value": "high"}]}


def _catalog(*items: dict[str, Any]) -> dict[str, Any]:
    return {"items": list(items)}


class TestResolveModel(unittest.TestCase):
    def test_exact_id_without_params(self) -> None:
        catalog = _catalog({"id": "cursor-grok-4.6-high"})

        self.assertEqual(resolve_model("cursor-grok-4.6-high", catalog), ModelSelection("cursor-grok-4.6-high", []))

    def test_alias_match(self) -> None:
        catalog = _catalog({"id": "grok-4.6-high-x", "aliases": ["cursor-grok-4.6-high"]})

        self.assertEqual(resolve_model("cursor-grok-4.6-high", catalog).id, "grok-4.6-high-x")

    def test_internal_prefix_is_stripped(self) -> None:
        catalog = _catalog({"id": "grok-4.6-high"})

        self.assertEqual(resolve_model("cursor-grok-4.6-high", catalog), ModelSelection("grok-4.6-high", []))

    def test_effort_suffix_becomes_param_and_fast_is_forced_off(self) -> None:
        catalog = _catalog(
            {
                "id": "grok-4.6",
                "parameters": [_FAST, _EFFORT],
                "variants": [
                    {"params": [{"id": "reasoning", "value": "high"}, {"id": "fast", "value": "true"}]},
                    {"params": [{"id": "reasoning", "value": "high"}, {"id": "fast", "value": "false"}]},
                ],
            }
        )

        selection = resolve_model("cursor-grok-4.6-high", catalog)

        self.assertEqual(selection.id, "grok-4.6")
        self.assertEqual(selection.params, [{"id": "reasoning", "value": "high"}, {"id": "fast", "value": "false"}])
        self.assertEqual(selection.to_payload(), {"id": "grok-4.6", "params": selection.params})

    def test_composer_gets_fast_false(self) -> None:
        catalog = _catalog({"id": "composer-2.5", "parameters": [_FAST]})

        self.assertEqual(resolve_model("composer-2.5", catalog).params, [{"id": "fast", "value": "false"}])

    def test_exact_id_preferred_over_base_with_effort(self) -> None:
        catalog = _catalog({"id": "grok-4.6", "parameters": [_EFFORT]}, {"id": "grok-4.6-high"})

        self.assertEqual(resolve_model("cursor-grok-4.6-high", catalog).id, "grok-4.6-high")

    def test_base_without_effort_parameter_is_rejected(self) -> None:
        catalog = _catalog({"id": "grok-4.6", "parameters": [_FAST]})

        with self.assertRaisesRegex(ValueError, "no parameter accepting 'high'"):
            resolve_model("cursor-grok-4.6-high", catalog)

    def test_unlisted_variant_is_rejected(self) -> None:
        catalog = _catalog(
            {"id": "composer-2.5", "parameters": [_FAST], "variants": [{"params": [{"id": "fast", "value": "true"}]}]}
        )

        with self.assertRaisesRegex(ValueError, "does not offer params"):
            resolve_model("composer-2.5", catalog)

    def test_variant_without_params_matches_empty_selection(self) -> None:
        catalog = _catalog({"id": "grok-4.6-high", "variants": [{"params": []}]})

        self.assertEqual(resolve_model("cursor-grok-4.6-high", catalog).params, [])

    def test_missing_model_lists_available_ids(self) -> None:
        catalog = _catalog({"id": "composer-2"}, {"id": "claude-4.6-sonnet-thinking"}, {"displayName": "no id"})

        with self.assertRaisesRegex(ValueError, r"available ids: \['claude-4.6-sonnet-thinking', 'composer-2'\]"):
            resolve_model("cursor-grok-4.6-high", catalog)

    def test_empty_catalog(self) -> None:
        with self.assertRaisesRegex(ValueError, "not in the Cloud Agents catalog"):
            resolve_model("composer-2.5", {})


if __name__ == "__main__":
    unittest.main()
