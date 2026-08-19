#!/usr/bin/env python3
"""POC: parse Azure Terraform (.tf) into ArchLucid infrastructureDeclarations payloads for agents."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

_RESOURCE_RE = re.compile(
    r'resource\s+"(?P<type>[^"]+)"\s+"(?P<name>[^"]+)"',
    re.IGNORECASE,
)


def resolve_object_type(terraform_type: str) -> str:
    normalized = terraform_type.lower()

    if any(token in normalized for token in ("key_vault", "firewall", "network_security_group")):
        return "SecurityBaseline"

    if "policy" in normalized:
        return "PolicyControl"

    return "TopologyResource"


def parse_simple_terraform(content: str) -> list[dict[str, str]]:
    objects: list[dict[str, str]] = []

    for match in _RESOURCE_RE.finditer(content):
        terraform_type = match.group("type").strip()
        name = match.group("name").strip()

        if not terraform_type or not name:
            continue

        objects.append(
            {
                "objectType": resolve_object_type(terraform_type),
                "name": name,
                "terraformType": terraform_type,
            }
        )

    return objects


def collect_tf_files(path: Path) -> list[Path]:
    if path.is_file():
        return [path]

    return sorted(
        candidate
        for candidate in path.rglob("*.tf")
        if candidate.is_file()
    )


def build_simple_terraform_declaration(name: str, content: str) -> dict[str, str]:
    return {
        "name": name,
        "format": "simple-terraform",
        "content": content,
    }


def build_json_declaration(name: str, content: str) -> dict[str, str]:
    resources = [
        {
            "type": item["terraformType"],
            "name": item["name"],
            "properties": {"terraformType": item["terraformType"]},
        }
        for item in parse_simple_terraform(content)
    ]
    declaration_document = {"resources": resources}

    return {
        "name": name,
        "format": "json",
        "content": json.dumps(declaration_document, separators=(",", ":")),
    }


def build_request_payload(
    *,
    system_name: str,
    description: str,
    declarations: list[dict[str, str]],
    request_id: str | None,
) -> dict[str, Any]:
    summary = f"Ingested {len(declarations)} Terraform declaration(s) via poc_tf_ingest.py."

    return {
        "requestId": request_id or f"tf-ingest-{Path('.').resolve().name}",
        "systemName": system_name,
        "description": description if len(description) >= 10 else f"Terraform ingest. {description}",
        "environment": "prod",
        "cloudProvider": "Azure",
        "constraints": ["Ingested from local Terraform files; review coverage before buyer-facing use."],
        "inlineRequirements": [summary],
        "infrastructureDeclarations": declarations,
    }


def ingest_path(
    path: Path,
    *,
    wire_format: str,
    system_name: str,
    description: str,
    request_id: str | None,
) -> dict[str, Any]:
    tf_files = collect_tf_files(path)

    if not tf_files:
        raise ValueError(f"No .tf files found under {path}")

    declarations: list[dict[str, str]] = []

    for tf_file in tf_files:
        content = tf_file.read_text(encoding="utf-8")

        if wire_format == "json":
            declaration = build_json_declaration(tf_file.name, content)
        else:
            declaration = build_simple_terraform_declaration(tf_file.name, content)

        declarations.append(declaration)

    return build_request_payload(
        system_name=system_name,
        description=description,
        declarations=declarations,
        request_id=request_id,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", type=Path, required=True, help=".tf file or directory to scan")
    parser.add_argument(
        "--format",
        choices=("simple-terraform", "json"),
        default="simple-terraform",
        help="Infrastructure declaration wire format (default: simple-terraform).",
    )
    parser.add_argument("--system-name", default="Terraform ingest")
    parser.add_argument(
        "--description",
        default="Architecture request generated from local Terraform files for Azure context ingestion.",
    )
    parser.add_argument("--request-id", default=None)
    parser.add_argument("--out", type=Path, default=None, help="Write POST /v1/architecture/request JSON here.")
    args = parser.parse_args(argv)

    try:
        payload = ingest_path(
            args.path.resolve(),
            wire_format=args.format,
            system_name=args.system_name,
            description=args.description,
            request_id=args.request_id,
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    rendered = json.dumps(payload, indent=2) + "\n"

    if args.out is not None:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered, encoding="utf-8")
        print(f"Wrote request payload to {args.out}")
    else:
        sys.stdout.write(rendered)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
