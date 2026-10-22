> **Scope:** Owner Windows development VM cost control — local scheduled task + optional Azure Automation.

# Development VM — conditional idle deallocate

**Last reviewed:** 2026-08-08

## What is live on vm-win-cus-01

| Piece | Status |
|-------|--------|
| Scheduled Task `ArchLucid-DevVm-IdleDeallocate` | Installed; every 15 minutes |
| Script | `C:\AzureVM\Invoke-LocalIdleDeallocate.ps1` |
| Mode | LIVE when `C:\AzureVM\DRY-RUN` is absent |
| Keepalive | `C:\AzureVM\Set-DevVmKeepAlive.ps1` / `Clear-DevVmKeepAlive.ps1` |
| Log | `C:\AzureVM\idle-deallocate.log` |

Deallocate uses `az vm deallocate` against `rg-ArchLucid-dev-cus` / `vm-win-cus-01` after a **45-minute** idle streak (no Active RDP, no protected processes, no keepalive, low CPU).

## Operator habits

| Situation | Action |
|-----------|--------|
| Long build / agent / Docker | `C:\AzureVM\Set-DevVmKeepAlive.ps1` |
| Done | `C:\AzureVM\Clear-DevVmKeepAlive.ps1` |
| Re-auth Azure CLI | `az login` (token used by the task) |

## Optional cloud backup

Terraform root: `infra/terraform-dev-vm-idle-shutdown/` (Azure Automation runbook). Primary path is the local task.
