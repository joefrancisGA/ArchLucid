variable "subscription_id" {
  type        = string
  description = "Azure subscription that hosts the development VM and Automation Account."
  default     = "8aa56f3b-18bc-43ca-ad45-bad9e811d33b"
}

variable "enable_idle_deallocate" {
  type        = bool
  description = "When false, Terraform creates no resources (safe default for validate-only CI)."
  default     = false
}

variable "location" {
  type        = string
  description = "Azure region for the Automation Account (use the VM region when possible)."
  default     = "centralus"
}

variable "automation_resource_group_name" {
  type        = string
  description = "Resource group that will hold the Automation Account (created when create_automation_resource_group is true)."
  default     = "rg-ArchLucid-dev-cus"
}

variable "create_automation_resource_group" {
  type        = bool
  description = "Create automation_resource_group_name; otherwise the group must already exist."
  default     = false
}

variable "automation_account_name" {
  type        = string
  description = "Azure Automation account name (6–50 alphanumeric)."
  default     = "aa-archlucid-dev-vm-idle"
}

variable "target_vm_resource_group_name" {
  type        = string
  description = "Resource group of the Windows development VM to evaluate."
  default     = "rg-ArchLucid-dev-cus"
}

variable "target_vm_name" {
  type        = string
  description = "Name of the Windows development VM to evaluate."
  default     = "vm-win-cus-01"
}

variable "schedule_timezone" {
  type        = string
  description = "IANA timezone for the Automation schedule (e.g. America/New_York)."
  default     = "America/New_York"
}

variable "check_interval_minutes" {
  type        = number
  description = "Legacy knob for docs/local task. Azure Automation (azurerm v4) schedules are hourly; local task remains every 15 minutes."
  default     = 15
}

variable "automation_schedule_frequency" {
  type        = string
  description = "Automation schedule frequency. azurerm v4 supports Day/Hour/Month/OneTime/Week (not Minute)."
  default     = "Hour"

  validation {
    condition     = contains(["Day", "Hour", "Month", "OneTime", "Week"], var.automation_schedule_frequency)
    error_message = "automation_schedule_frequency must be one of Day, Hour, Month, OneTime, Week."
  }
}

variable "automation_schedule_interval" {
  type        = number
  description = "Automation schedule interval for the chosen frequency (1 = every hour when frequency is Hour)."
  default     = 1
}

variable "idle_lookback_minutes" {
  type        = number
  description = "CPU/network idle window that must be quiet before deallocate (recommended 45)."
  default     = 45

  validation {
    condition     = var.idle_lookback_minutes >= 30 && var.idle_lookback_minutes <= 180
    error_message = "idle_lookback_minutes must be between 30 and 180."
  }
}

variable "cpu_threshold_percent" {
  type        = number
  description = "Average Percentage CPU over the lookback must be strictly below this value."
  default     = 5

  validation {
    condition     = var.cpu_threshold_percent > 0 && var.cpu_threshold_percent <= 50
    error_message = "cpu_threshold_percent must be between 0 (exclusive) and 50."
  }
}

variable "network_threshold_bytes" {
  type        = number
  description = "Sum of Network In Total + Network Out Total (bytes) over the lookback must be strictly below this value."
  default     = 52428800
}

variable "keepalive_path" {
  type        = string
  description = "Guest OS path that blocks deallocate when present."
  default     = "C:\\AzureVM\\DO-NOT-SHUTDOWN"
}

variable "protected_process_names" {
  type        = list(string)
  description = "Guest process names (without .exe) that block deallocate while running. Cursor.exe is intentionally omitted."
  default = [
    "MSBuild",
    "dotnet",
    "npm",
    "node",
    "git",
    "docker",
    "docker-compose",
    "com.docker.backend",
    "dockerd",
  ]
}

variable "dry_run" {
  type        = bool
  description = "When true, the Automation runbook evaluates idle conditions but never calls Stop-AzVM."
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to Automation resources."
  default = {
    Workload    = "archlucid-dev-vm-idle-shutdown"
    CostCenter  = "owner-engineering"
    Environment = "dev"
    TargetVm    = "vm-win-cus-01"
  }
}
