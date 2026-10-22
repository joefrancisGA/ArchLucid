#!/usr/bin/env python3
"""Validate customer cloud-extractor templates (WIF + scheduled agent) without Azure credentials."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
TERRAFORM_DIR = REPO_ROOT / "deploy" / "customer-templates" / "terraform"
BICEP_FILE = REPO_ROOT / "deploy" / "customer-templates" / "bicep" / "main.bicep"
SCHEDULED_AGENT_DIR = (
    REPO_ROOT / "deploy" / "customer-templates" / "scheduled-agent" / "terraform"
)
SCHEDULED_AGENT_RUNBOOK = (
    REPO_ROOT
    / "deploy"
    / "customer-templates"
    / "scheduled-agent"
    / "runbook"
    / "Invoke-ArchLucidScheduledAzureExtractor.Runbook.ps1"
)
SCHEDULED_COLLECTOR_SCRIPTS = (
    REPO_ROOT / "scripts" / "azure" / "Get-ArchLucidAzurePackage.ps1",
    REPO_ROOT / "scripts" / "azure" / "ArchLucid.ScheduledExtractor.helpers.ps1",
    REPO_ROOT / "scripts" / "azure" / "Send-ArchLucidAzureExtractorPackage.ps1",
    REPO_ROOT / "scripts" / "azure" / "Invoke-ArchLucidScheduledAzureExtractor.ps1",
    REPO_ROOT / "scripts" / "ArchLucid.AuthHeaders.ps1",
)


def _run(command: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )


def _tool_on_path(name: str) -> bool:
    return shutil.which(name) is not None


def _validate_terraform_dir(terraform_dir: Path) -> tuple[str, int]:
    if not _tool_on_path("terraform"):
        return ("SKIP terraform: CLI not on PATH", 0)

    fmt = _run(["terraform", "fmt", "-check", "-recursive", "."], cwd=terraform_dir)

    if fmt.returncode != 0:
        return (f"FAIL terraform fmt -check:\n{fmt.stdout}\n{fmt.stderr}", 1)

    init = _run(["terraform", "init", "-backend=false"], cwd=terraform_dir)

    if init.returncode != 0:
        return (f"FAIL terraform init:\n{init.stdout}\n{init.stderr}", 1)

    validate = _run(["terraform", "validate"], cwd=terraform_dir)

    if validate.returncode != 0:
        return (f"FAIL terraform validate:\n{validate.stdout}\n{validate.stderr}", 1)

    return ("OK terraform fmt + validate", 0)


def validate_terraform() -> tuple[str, int]:
    return _validate_terraform_dir(TERRAFORM_DIR)


def validate_bicep() -> tuple[str, int]:
    if _tool_on_path("az"):
        build = _run(["az", "bicep", "build", "--file", str(BICEP_FILE)])

        if build.returncode == 0:
            return ("OK az bicep build", 0)

        return (f"FAIL az bicep build:\n{build.stdout}\n{build.stderr}", 1)

    if _tool_on_path("bicep"):
        build = _run(["bicep", "build", str(BICEP_FILE)])

        if build.returncode == 0:
            return ("OK bicep build", 0)

        return (f"FAIL bicep build:\n{build.stdout}\n{build.stderr}", 1)

    return ("SKIP bicep: neither az nor bicep CLI on PATH", 0)


def validate_scheduled_agent_files() -> tuple[str, int]:
    missing = [str(path) for path in SCHEDULED_COLLECTOR_SCRIPTS if not path.is_file()]

    if not SCHEDULED_AGENT_RUNBOOK.is_file():
        missing.append(str(SCHEDULED_AGENT_RUNBOOK))

    main_tf = SCHEDULED_AGENT_DIR / "main.tf"

    if not main_tf.is_file():
        missing.append(str(main_tf))

    if missing:
        return ("FAIL missing scheduled-agent files:\n" + "\n".join(missing), 1)

    terraform_text = main_tf.read_text(encoding="utf-8")
    runbook_text = SCHEDULED_AGENT_RUNBOOK.read_text(encoding="utf-8")

    if "Get-ArchLucidAzurePackage.ps1" not in terraform_text:
        return ("FAIL scheduled-agent terraform does not pin Get-ArchLucidAzurePackage.ps1", 1)

    if "Connect-AzAccount -Identity" not in runbook_text:
        return ("FAIL scheduled-agent runbook does not sign in with managed identity", 1)

    if "Invoke-ArchLucidScheduledAzureExtractor.ps1" not in runbook_text:
        return ("FAIL scheduled-agent runbook does not invoke the shared orchestrator", 1)

    return _validate_terraform_dir(SCHEDULED_AGENT_DIR)


def main() -> int:
    messages: list[str] = []
    exit_code = 0

    for label, validator in (
        ("terraform", validate_terraform),
        ("bicep", validate_bicep),
        ("scheduled-agent", validate_scheduled_agent_files),
    ):
        message, code = validator()
        messages.append(f"[{label}] {message}")

        if code != 0:
            exit_code = code

    print("\n".join(messages))

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
