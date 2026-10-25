# EXW-01 — Classify the AKS workload-image HTTP error

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement EXW-02 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Classify this package warning and stop:

`aks-workload-images-not-collected-customer-script:http-error:/subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/resourceGroups/tie0-caks-nprd-hi/providers/Microsoft.ContainerService/managedClusters/aks-maks-hi-nprd-weus-300`

## Why

`http-error` means `Invoke-AzRestMethod` returned a status other than 401 or 403. The package does not keep that status. The next collection cannot be fixed until the status is known.

## Fixed scope

- Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`
- Subscription `0966098b-4d6c-4f09-af1b-965bc2a2ad1d`
- Cluster resource id in the warning above
- Collector call: `POST {cluster}/runCommand?api-version=2024-02-01` with the read-only command from `Get-ArchLucidAzureAksWorkloadImageKubectlCommand`

## What to run

Use the current Az context. If `Get-AzContext` is missing, or its tenant is not the tenant above, stop and say the session is not signed in to that tenant.

1. GET the cluster at `api-version=2024-02-01`. Record `properties.provisioningState`, `properties.powerState.code`, and whether `properties.apiServerAccessProfile` exists. Do not print authorized IP addresses.
2. POST `runCommand` with the same kubectl jsonpath command the collector uses. Record the HTTP status. On 202, poll the command result at most five times, two seconds apart, and record `properties.provisioningState`. Do not print command logs.

Read `Resolve-ArchLucidAzureAksRunCommandHttpOutcomeKind` before the probe. 401 and 403 would have been `insufficient-rbac`. Any other non-success status is `http-error`.

## How to classify

| Status | Class |
|--------|--------|
| 401 or 403 | Permission. The collecting identity needs `Microsoft.ContainerService/managedClusters/runCommand/action` (Azure Kubernetes Service Cluster Admin Role, or the org equivalent) on this cluster. |
| 404 | The cluster id in the warning does not match a cluster this identity can see. |
| 409 | The cluster is not in a state that accepts run command. Name `provisioningState` and `powerState`. |
| Other 4xx or 5xx | Azure API error. Quote the ARM `error.code` and `error.message`. |
| 200 or 202, then Succeeded | The failure does not reproduce. Say that a fresh package run is the next check. |
| 200 or 202, then Failed or Canceled | Cluster run command failed. Quote `properties.reason` when present. Do not quote logs. |

## Report

Reply with the class, the HTTP status, the cluster power state, and the single next action for the person who owns the Azure identity. Do not grant a role. Do not re-run the package script.

## Constraints

- Do not edit the repo.
- Do not commit.
- Do not assign RBAC or change the cluster.
- Do not print tokens, kubeconfigs, or command logs.
- Do not re-run NR-36.
