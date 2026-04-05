#!/usr/bin/env python3
"""
CI guard: context-ingestion must stay on explicit connector and document-parser pipelines.

Fails if composition registers IContextConnector directly (bypasses ordered IEnumerable factory)
or if ServiceCollectionExtensions partials drop the ordered factory calls.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Context ingestion DI lives in Host.Composition partials (moved out of ArchiForge.Api).
_STARTUP_DIR = ROOT / "ArchiForge.Host.Composition" / "Startup"


def _composition_extension_sources() -> list[Path]:
    if not _STARTUP_DIR.is_dir():
        return []
    return sorted(_STARTUP_DIR.glob("ServiceCollectionExtensions*.cs"))


def main() -> int:
    paths = _composition_extension_sources()
    if not paths:
        print(
            f"Missing ArchiForge.Host.Composition Startup partials under {_STARTUP_DIR}",
            file=sys.stderr,
        )
        return 2

    text = "\n".join(p.read_text(encoding="utf-8") for p in paths)

    if re.search(r"AddSingleton\s*<\s*IContextConnector\b", text):
        print(
            "Forbidden: AddSingleton<IContextConnector> — use concrete connectors + "
            "ContextConnectorPipeline.CreateOrderedContextConnectorPipeline only.",
            file=sys.stderr,
        )
        return 1

    if "CreateOrderedContextConnectorPipeline" not in text:
        print(
            "Expected CreateOrderedContextConnectorPipeline in ServiceCollectionExtensions.",
            file=sys.stderr,
        )
        return 1

    if "CreateOrderedContextDocumentParsers" not in text:
        print(
            "Expected CreateOrderedContextDocumentParsers in ServiceCollectionExtensions.",
            file=sys.stderr,
        )
        return 1

    print("context ingestion DI guards: ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
