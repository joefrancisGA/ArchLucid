# Workflow `trial-lifecycle-email` (placeholder)

**Objective:** Send scheduled trial lifecycle emails (ACS / Outlook) from Service Bus messages of type `com.archlucid.notifications.trial-lifecycle-email.v1`, or drive recurrence in Logic Apps when the API no longer scans.

**Service Bus:** enable `enable_logic_app_trial_lifecycle_email_subscription` in `infra/terraform-servicebus/` and point the trigger at subscription `logic_app_trial_lifecycle_email_subscription_name` (see module outputs).

**Cutover:** set `ArchLucid:Notifications:TrialLifecycle:Owner` to `LogicApp` so `TrialLifecycleEmailScanHostedService` and the Container Apps trial email job stop enqueueing due scans (`TrialScheduledLifecycleEmailScanner` no-ops).

**Still out of repo:** `workflow.json`, connection references, and any optional “due envelopes” HTTP action against an internal read API.
