# Workflow `trial-lifecycle-email` (placeholder)

**Objective:** Send scheduled trial lifecycle emails (ACS / Outlook) from Service Bus messages of type `com.archlucid.notifications.trial-lifecycle-email.v1`, or drive recurrence in Logic Apps when the API no longer scans.

## Logic App host (Terraform)

Optional dedicated site: set **`enable_trial_lifecycle_logic_app = true`** and **`trial_lifecycle_storage_account_name`** in **`infra/terraform-logicapps/`**. After apply, set **`trial_lifecycle_logic_app_managed_identity_principal_id`** in **`infra/terraform-servicebus/`** to output **`trial_lifecycle_logic_app_principal_id`** (then enable **`enable_logic_app_trial_lifecycle_email_subscription`** and re-apply Service Bus).

**Service Bus:** enable `enable_logic_app_trial_lifecycle_email_subscription` in `infra/terraform-servicebus/` and point the trigger at output **`logic_app_trial_lifecycle_email_subscription_name`**.

**Cutover:** set `ArchLucid:Notifications:TrialLifecycle:Owner` to `LogicApp` so `TrialLifecycleEmailScanHostedService` and the Container Apps trial email job stop enqueueing due scans (`TrialScheduledLifecycleEmailScanner` no-ops).

**Still out of repo:** `workflow.json`, connection references, and any optional “due envelopes” HTTP action against an internal read API.
