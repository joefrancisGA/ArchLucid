> **Scope:** Customer-facing — prepare for a pilot, run the first architecture review, interpret outputs, report issues, and get help.

# Pilot guide

Use this guide to prepare for a pilot, run the first architecture review, review outputs, and know how to get help.

> **Important:** Cloud connectors are available for **Azure, AWS, and GCP**. Use them when the review needs source-system evidence such as cloud inventory, configuration, identity, policy, cost, or operational signals.

## Prepare for a pilot

Before your first session, confirm:

- **Workspace access** — sign in with your corporate identity and select the correct workspace from the header switcher.
- **Evidence in hand** — a brief, diagrams, documents, IaC, screenshots, exports, or policy PDFs are enough to start.
- **Optional cloud connectors** — when security approves read-only access, connect Azure, AWS, or GCP under **Settings → Cloud connections**.

### Evidence-only review path

Use this path when connector access has not yet been approved, or when the first session only has uploaded evidence:

1. Start a review with **No cloud / evidence-only** as the cloud target.
2. Upload files or paste your architecture brief — a cloud connector is **not** required.
3. Execute, finalize, and export the sponsor packet.

### Cloud connector intake checklist

Share this checklist with security, platform, or cloud operations teams before requesting connector access:

- Read-only scope and no long-lived secrets in ArchLucid when using laptop-side inventory upload.
- Provider-specific steps under **Help → Cloud connections** (Azure, AWS, and GCP).
- Your organization's cloud risk questionnaire alongside ArchLucid's connector security summary.

### Optional specialty templates

When the buyer job is clear, optional templates cover **SaaS readiness**, **AI governance**, and **healthcare policy** reviews. See [Specialty walkthroughs](/help/specialty-walkthroughs) — not required before first value.

## Run the first review

The guided workflow on **Home** walks readiness → evidence → create → execute → finalize → sponsor packet.

**Four-step sponsor narrative:**

1. **Create** an architecture review from **New review** or the sample showcase.
2. **Execute** the assessment on review detail until findings are ready to finalize.
3. **Finalize** the architecture package to lock the signed review record and exports.
4. **Open exports** — download the sponsor packet and executive summary.

For step-by-step depth, open [Your first architecture review](/help/first-architecture-review) or the checklist on **Onboarding**.

## Review outputs

After finalize, each architecture package includes:

| Output | What it gives you |
|--------|-------------------|
| **Findings** | Severity, business impact, evidence citations, and recommended actions |
| **Signed review record** | Immutable decision snapshot for audit and procurement |
| **Sponsor packet** | Shareable export for executives and program sponsors |
| **Executive summary** | ROI and disposition labels when cost evidence is attached |
| **Audit export** | Scoped CSV when your role includes audit access |

**Good to know:** Use **Email this review to your sponsor** on review detail after finalize when sponsor handoff is enabled for your workspace.

**Tenant memory:** Finalized decisions and findings are automatically searchable in **Ask** for future reviews in the same project. See [Prior manifest retrieval](/help/prior-manifest-retrieval) for what makes a useful prior and when to avoid noisy runs.

## Report an issue

When something fails during a pilot, include:

- **What you were doing** — page, action, and review name if applicable.
- **Review identifier** — shown on review detail and in error banners.
- **Correlation identifier** — copy from the error banner when present.
- **Screenshot** — redact secrets and customer data.

Open [Troubleshooting](/help/troubleshooting) for symptom-first fixes before filing a ticket.

## Get help

- **Product and pilot questions:** **support@archlucid.net**
- **Security vulnerabilities:** **security@archlucid.net** (coordinated disclosure only)
- **Accessibility barriers:** **accessibility@archlucid.net**
- **Self-serve Q&A:** [Getting started](/help/getting-started) and [Troubleshooting](/help/troubleshooting)

<details>
<summary>Advanced operator notes — for platform and engineering teams</summary>

The sections below are for teams deploying, integrating, or validating ArchLucid infrastructure. They are not required for a buyer's first architecture review.

### Environment and release readiness

1. **Run / deploy readiness** — environment checks your team runs before declaring production-ready.
2. **Release smoke** — API, CLI, and artifact checks documented in engineering runbooks.
3. **Live end-to-end validation** — UI and database parity tests when your team owns CI gates.

### Reference architecture payloads

Starter architecture request JSON patterns for instant pilot runs live under engineering template folders. Submit the JSON body to the architecture request API (same contract as the new-review wizard import). See [CLI usage](/help/cli-usage) for non-interactive commands.

### Support bundle and API diagnostics

When policy allows, engineering support may request API version output, correlation identifiers, logs, and a CLI support bundle. See [Admin diagnostics](/help/admin-diagnostics) and [CLI usage](/help/cli-usage).

### Post-commit sponsor banner

After the first finalized review, review detail may show **Email this review to your sponsor** and a day-count badge anchored to your workspace's first finalize timestamp.

### Pull-request decoration in CI

ArchLucid can surface review comparison output in GitHub Actions and Azure DevOps pipelines. See [CI/CD integration guide](/help/review-guide) and integration docs linked from [Troubleshooting](/help/troubleshooting).

### Baseline fields at signup

Optional review-cycle baseline fields may be captured during workspace registration for ROI modeling. See [Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement).

### Complete first-session operator path

Platform teams implementing the full storage → evidence → finalize → export sequence should follow [Your first architecture review](/help/first-architecture-review) ([#complete-review-workflow](/help/first-architecture-review#complete-review-workflow)).

</details>
