# GCP Tier 2 hosted extractor (TB-403)

Reusable Terraform module that emits application configuration for:

- `HostedGcpExtractor:Enabled`
- `HostedGcpExtractor:ArchLucidManagedIdentityClientId`
- `CloudPolling:Gcp:Enabled`
- `CloudPolling:Gcp:IntervalHours`

Wire `app_settings` into the worker/API Container Apps environment. No long-lived GCP service-account JSON keys are provisioned in Azure Key Vault on the primary Workload Identity Federation path (PQ-CLOUD-01 option a).

Customer-side Workload Identity Pool binding and Cloud Asset Viewer IAM remain customer-controlled steps documented in the trust center.
