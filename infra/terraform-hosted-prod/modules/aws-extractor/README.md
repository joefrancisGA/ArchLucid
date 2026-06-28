# AWS Tier 2 hosted extractor (TB-402)

Reusable Terraform module that emits application configuration for:

- `HostedAwsExtractor:Enabled`
- `HostedAwsExtractor:ArchLucidManagedIdentityClientId`
- `CloudPolling:Aws:Enabled`
- `CloudPolling:Aws:IntervalHours`

Wire `app_settings` into the worker/API Container Apps environment. No long-lived AWS access keys are provisioned in Azure Key Vault on the primary OIDC path (PQ-CLOUD-01 option a).

Customer-side IAM role trust and Resource Explorer enablement remain customer-controlled steps documented in the trust center.
