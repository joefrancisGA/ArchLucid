> **Scope:** Core Pilot spine — shortest path from “new review” to committed manifest + review package; defers playbook depth to the evaluation guide and operator quickstart.
> **Hub:** [`START_HERE.md`](START_HERE.md).

# Core Pilot

Use this page when you need the **four-step Core Pilot** narrative without scrolling the full evaluator guide. **Buyer / hosted path** (no install) stays in **Part 1** of [**onboarding/EVALUATION_GUIDE.md**](onboarding/EVALUATION_GUIDE.md); Core Pilot specifics are expanded in **Part 2** of that guide.

---

## 1. What stays secondary (scope boundary)

Do not mistake the Core Pilot checklist for full product scope — advanced Operate lanes, entitlement-specific depth, and GA-gated paths live under **[`library/V1_SCOPE.md`](library/V1_SCOPE.md)** and linked runbooks. Use Core Pilot to prove **request → execute → commit → review package** once on **your** inputs.

---

## 2. Canonical depth and commands

| Need | Doc |
|------|-----|
| Step-by-step UI + “what good looks like” | [`onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md) (**Part 2 — Core Pilot**) |
| Healthcare claims policy pack → run → gate → commit (demo seed) | [`library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) |
| CLI / curl spine (repository root) | [`library/OPERATOR_QUICKSTART.md`](library/OPERATOR_QUICKSTART.md) |
| First-session wizard in the hosted operator shell | `/onboarding` (in-product); see [`library/FIRST_RUN_WIZARD.md`](library/FIRST_RUN_WIZARD.md) |

---

## First session checklist

Four steps — same sequence as [**onboarding/EVALUATION_GUIDE.md**](onboarding/EVALUATION_GUIDE.md) Part 2:

### Step-by-step walkthrough

1. **Create** an architecture review (operator **New review** wizard or **`archlucid run`** CLI with project inputs — the CLI verb remains `run` for backward compatibility).
2. **Execute** the **review** (pipeline) and let the coordinator complete the work (timeline on the **review detail** page — legacy routes may still use `/runs/`).

### Review manifest and artifacts

3. **Commit** the manifest (produces golden manifest + synthesized artifacts — nothing exportable before this step).
4. **Open** the review package — manifest summary, artifacts table, and bundle export on the **review detail** page.

**Sponsor-visible artifact:** after commit, use the operator **review detail** (**“Email this review to your sponsor”** banner when manifest exists; exact UI copy may still say *run* until label-only updates land) plus **[`go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** for narrative context.
