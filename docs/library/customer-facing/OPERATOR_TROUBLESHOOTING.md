> **Scope:** Operator-facing troubleshooting — symptoms, first checks, and in-app next steps. For CLI, logs, and environment variables, open **Engineering troubleshooting runbook** in Help.

# Operator troubleshooting

Start with the symptom that matches what you see. Each entry lists a first check inside ArchLucid, then where to go next.

## Most common issues

### Home page or workspace readiness looks empty

| | |
|---|---|
| **What you see** | Workspace readiness does not load, or the section stays blank for a long time |
| **Likely cause** | API unavailable, seed data not loaded, or scope headers mismatch |
| **First check** | Open **System status** (`/health`) and confirm API readiness is green |
| **Next step** | Retry after the API is healthy; open **Admin diagnostics** in Help if checks stay degraded |

### Sample review package missing

| | |
|---|---|
| **What you see** | No sample review on Home or the reviews list |
| **Likely cause** | Demo seed not applied or wrong workspace scope |
| **First check** | Confirm you are in the intended workspace; refresh Home |
| **Next step** | Follow **Getting started** in Help, then **Full operating path** |

### Review package does not open

| | |
|---|---|
| **What you see** | Selecting a review shows an error or endless loading |
| **Likely cause** | Wrong run id, scope mismatch, or API error |
| **First check** | Note the error message and any correlation id shown in the UI |
| **Next step** | Open **Troubleshooting decision tree** (below) for auth and API paths |

### Findings count looks wrong

| | |
|---|---|
| **What you see** | Findings on Home or in the package do not match expectations |
| **Likely cause** | Filters, stale list, or review still in progress |
| **First check** | Open the review package and confirm pipeline status is complete |
| **Next step** | Compare with the evidence trail and manifest summary |

### Export or deliverable download unavailable

| | |
|---|---|
| **What you see** | Export button disabled or download fails |
| **Likely cause** | Review not finalized, missing manifest, or permission |
| **First check** | Confirm the signed decision record is finalized |
| **Next step** | See **Governance approval** and **Audit trail** topics in Help |

### Ask or compare unavailable

| | |
|---|---|
| **What you see** | Ask, compare, or operate surfaces greyed out |
| **Likely cause** | Feature gated until first commit or trial limit |
| **First check** | Finish the first review commit on the core pilot path |
| **Next step** | **Repeat-review stickiness loop** in Help after first commit |

### Evidence upload failed

| | |
|---|---|
| **What you see** | Upload error on new review or extractor path |
| **Likely cause** | Invalid file, size limit, or extractor manifest issue |
| **First check** | Read the inline error; confirm file type and size |
| **Next step** | **Evidence intake** in Help |

### Permissions or sign-in issue

| | |
|---|---|
| **What you see** | 401/403 style errors or missing actions |
| **Likely cause** | Role, token, or workspace scope |
| **First check** | Settings → identity; confirm role matches the action |
| **Next step** | **Operator authentication and roles** (engineering topic) if IT manages Entra |

---

## Decision tree (deeper triage)

The sections below walk API, SQL, auth, execute stalls, and commit conflicts step by step. Use them when the quick fixes above are not enough.
