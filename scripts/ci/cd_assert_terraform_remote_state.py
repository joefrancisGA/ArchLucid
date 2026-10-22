#!/usr/bin/env python3
"""Assert that an initialized Terraform root is bound to remote state.

Why this exists: `infra/terraform-container-apps/backend.tf` is gitignored, so a CI checkout has no
backend block at all. Plain `terraform init` then silently selects the *implicit local* backend and
starts from empty state on the ephemeral runner disk. The symptom is a plan that proposes creating
every resource — including the resource group — against infrastructure that already exists, which
makes both the plan artifact and the guards that inspect it meaningless, and would make
`terraform apply` attempt to create live resources a second time.

Detection uses Terraform's own backend record at `<dir>/.terraform/terraform.tfstate`, written by
`terraform init`. Verified against Terraform 1.15.8:

  * no backend block            -> the file is not written at all
  * `backend "local" {}`        -> file exists with `backend.type == "local"`
  * `backend "azurerm" {...}`   -> file exists with `backend.type == "azurerm"`

So a missing record and an explicit `local` type both mean "state is not durable across runs".

Exit codes: 0 when remote (or when only warning is requested), 1 when state is not remote and
`--require-remote` was passed. Callers gate `--require-remote` on whether an apply will actually run,
so routine image-only deploys stay unblocked while a state-less apply is refused.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

# Backends whose state lives on the runner's own disk, and therefore does not survive the job.
EPHEMERAL_BACKEND_TYPES: frozenset[str] = frozenset({"local"})

REMEDIATION = (
    "Provide the backend configuration to CD: set the environment-scoped secret TF_BACKEND_TF to the "
    "full contents of backend.tf (a terraform{} block containing the azurerm backend for this "
    "environment's state key). See infra/terraform-container-apps/README.md § Terraform state."
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--terraform-dir",
        required=True,
        help="Terraform root that was just initialized (the directory containing .terraform/).",
    )
    parser.add_argument(
        "--require-remote",
        action="store_true",
        help="Fail (exit 1) instead of warning when state is not remote. Use when an apply will run.",
    )
    return parser.parse_args(argv)


def backend_record_path(terraform_dir: Path) -> Path:
    """Location of the backend record `terraform init` writes for the selected backend."""
    return terraform_dir / ".terraform" / "terraform.tfstate"


def read_backend_record(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    """Parse the backend record. Returns (record, problem); exactly one of the two is None."""

    if not path.is_file():
        return (
            None,
            "Terraform wrote no backend record (.terraform/terraform.tfstate is absent), which means "
            "no backend block was present and the implicit local backend was selected.",
        )

    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        return None, f"Could not read the Terraform backend record at {path}: {error}"

    if not isinstance(parsed, dict):
        return None, f"The Terraform backend record at {path} is not a JSON object."

    return parsed, None


def backend_type(record: dict[str, Any]) -> str | None:
    """The configured backend type (e.g. `azurerm`), or None when the record omits it."""
    backend = record.get("backend")

    if not isinstance(backend, dict):
        return None

    declared = backend.get("type")

    # Guard against an explicit JSON null as well as a non-string type.
    if not isinstance(declared, str) or declared.strip() == "":
        return None

    return declared.strip()


def classify(terraform_dir: Path) -> tuple[bool, str]:
    """Returns (is_remote, human-readable detail) for an initialized Terraform root."""

    if not terraform_dir.is_dir():
        return False, f"Terraform directory {terraform_dir} does not exist."

    record, problem = read_backend_record(backend_record_path(terraform_dir))

    if problem is not None:
        return False, problem

    assert record is not None  # read_backend_record returns a record whenever problem is None.
    declared = backend_type(record)

    if declared is None:
        return False, "The Terraform backend record does not declare a backend type."

    if declared in EPHEMERAL_BACKEND_TYPES:
        return (
            False,
            f"Terraform is using the '{declared}' backend, whose state file lives on the runner disk "
            "and is discarded when the job ends.",
        )

    return True, f"Terraform is using the '{declared}' backend."


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    terraform_dir = Path(args.terraform_dir)
    is_remote, detail = classify(terraform_dir)

    if is_remote:
        print(f"Terraform remote state confirmed. {detail}")
        return 0

    if args.require_remote:
        print(f"::error::Terraform state is not remote. {detail}")
        print(
            "::error::Refusing to apply: with empty local state Terraform would plan to create "
            "resources that already exist. " + REMEDIATION
        )
        return 1

    print(f"::warning::Terraform state is not remote. {detail}")
    print(
        "::warning::This plan is not state-backed, so it proposes creating existing infrastructure "
        "and the plan-guard assertions are not checking a real diff. " + REMEDIATION
    )
    return 0


if __name__ == "__main__":  # pragma: no cover - module entry point
    raise SystemExit(main())
