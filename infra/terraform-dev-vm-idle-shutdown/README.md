# Terraform: conditional idle deallocation for ArchLucid Windows development VM (vm-win-cus-01)

**Primary control on this VM:** local Scheduled Task `ArchLucid-DevVm-IdleDeallocate` (`C:\AzureVM\Invoke-LocalIdleDeallocate.ps1`).

**This Terraform root:** optional Azure Automation backup (metrics + Run Command + `Stop-AzVM`).

## Local task (already installed on vm-win-cus-01)

- Every 15 minutes
- Deallocates after **45 minutes** of consecutive idle observations
- Blocks on Active RDP, protected processes, keepalive file `C:\AzureVM\DO-NOT-SHUTDOWN`, CPU sample
- Uses `az vm deallocate` (requires `az login` token cache for `jafrancis@comcast.net`)
- LIVE when `C:\AzureVM\DRY-RUN` is absent

```powershell
C:\AzureVM\Set-DevVmKeepAlive.ps1 -Reason 'long build'
C:\AzureVM\Clear-DevVmKeepAlive.ps1
Get-Content C:\AzureVM\idle-deallocate.log -Tail 20
```

## Apply Automation backup

```powershell
cd C:\ArchLucid\infra\terraform-dev-vm-idle-shutdown
az account set --subscription 8aa56f3b-18bc-43ca-ad45-bad9e811d33b
terraform init
terraform apply
```

Start with `dry_run = true` in `terraform.tfvars`, validate a manual job, then set `dry_run = false`.
