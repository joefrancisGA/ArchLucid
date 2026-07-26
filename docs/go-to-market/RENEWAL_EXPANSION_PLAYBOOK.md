> **Reviewed:** 2026-07-26

> **Scope:** Renewal and expansion playbook plus customer health scoring framework (formerly `CUSTOMER_HEALTH_SCORING.md`).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid — Renewal and expansion playbook

**Audience:** Customer success, account management, sales leadership, and product leadership.

**Last reviewed:** 2026-07-26

---

## 1. Customer health scoring

Detect **churn risk** early, identify **expansion** opportunities, and give the CS team a **single composite health score** per account. Starts manual (Phase 1) and evolves toward in-product automation.

### Health dimensions

| Dimension | Weight | Signals | Data source |
|-----------|--------|---------|-------------|
| **Engagement** | 30% | Runs per week, unique active operators, login frequency | `dbo.Runs` (created dates), `dbo.AuditEvents` (actor diversity) |
| **Breadth** | 20% | Finding engine types used, comparison runs, export frequency, workspaces active | Run metadata, audit events |
| **Quality** | 15% | Average agent output quality score, explainability trace completeness ratio, product-learning disposition mix (`Trusted` vs `Revised` / `Rejected` / `NeedsFollowUp`) | OTel metrics (`archlucid.authority.agent_output_quality`, `archlucid.explanation_trace_completeness_ratio`), `dbo.ProductLearningPilotSignals` |
| **Governance adoption** | 20% | Approval requests created/resolved, policy packs configured, segregation of duties active | `dbo.GovernanceApprovalRequests`, governance audit events |
| **Support** | 15% | Ticket volume, severity distribution, time-to-resolution, CSAT | External support tool (placeholder) |

### Scoring model

#### Per-dimension scale (1–5)

| Score | Label | Criteria (example: Engagement) |
|-------|-------|-------------------------------|
| **5** | Excellent | 10+ runs/week, 5+ active operators |
| **4** | Good | 5–9 runs/week, 3–4 active operators |
| **3** | Adequate | 2–4 runs/week, 2 active operators |
| **2** | Needs attention | 1 run/week, 1 active operator |
| **1** | At risk | No runs in 2+ weeks, no logins |

Each dimension has its own scale definition (adapt from template above). Document per-dimension thresholds when real data becomes available.

#### Composite score

**Composite = Σ(dimension score × dimension weight)**

| Composite range | Health status | Color |
|----------------|---------------|-------|
| **4.0–5.0** | Healthy | Green |
| **2.5–3.9** | Needs attention | Yellow |
| **1.0–2.4** | At risk | Red |

### Implementation phases

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 1 (manual)** | CS team fills in a spreadsheet monthly using SQL queries and support data. Review in team standup. | Low — spreadsheet + ad hoc SQL |
| **Phase 2 (semi-automated)** | Scheduled SQL report (stored procedure or Python script) emailed to CS weekly. Include product-learning feedback disposition counts; support data manually appended. | Medium — script + scheduled job |
| **Phase 3 (in-product)** | Admin dashboard with health metrics per tenant/workspace. Alerting on Red accounts. Support integration via API. | High — UI + backend + integration |

**Start with Phase 1.** Build the habit of reviewing health before building tooling.

#### Phase 1 SQL queries (starter)

```sql
-- Engagement: runs per week for a tenant (last 4 weeks)
SELECT
    DATEPART(ISOWK, CreatedUtc) AS Week,
    COUNT(*) AS RunCount,
    COUNT(DISTINCT CreatedBy) AS UniqueOperators
FROM dbo.Runs
WHERE TenantId = @TenantId
  AND CreatedUtc >= DATEADD(WEEK, -4, GETUTCDATE())
GROUP BY DATEPART(ISOWK, CreatedUtc)
ORDER BY Week;

-- Governance adoption: approval requests in last 30 days
SELECT COUNT(*) AS ApprovalRequests
FROM dbo.GovernanceApprovalRequests
WHERE TenantId = @TenantId
  AND CreatedUtc >= DATEADD(DAY, -30, GETUTCDATE());
```

### Health action playbooks

| Health status | CS action |
|---------------|-----------|
| **Healthy** (Green) | Expansion conversation; request case study / reference; quarterly business review |
| **Needs attention** (Yellow) | Proactive check-in within 1 week; offer training session or feature walkthrough; identify blockers |
| **At risk** (Red) | Escalate to account exec within 48 hours; engage executive sponsor on customer side; assess root cause (product gap, onboarding failure, champion departure) |

---

## 2. Renewal timeline (annual subscription)

| Milestone | Action | Owner |
|-----------|--------|-------|
| **R-90 days** | Review health score ([§1](#1-customer-health-scoring)); analyze usage trends; identify expansion signals | CSM |
| **R-60 days** | Renewal conversation with champion; review ROI model actuals vs pilot projections ([ROI_MODEL.md](ROI_MODEL.md)); discuss tier alignment | CSM + Account Exec |
| **R-30 days** | Commercial terms finalized; pricing adjustment if tier change; order form prepared ([ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md)) | Account Exec |
| **Renewal date** | Signed order form; billing updated; success confirmation email | Operations |
| **R+7 days** | Post-renewal check-in; set goals for next term | CSM |

---

## 3. Expansion triggers

| Trigger | Signal | Opportunity |
|---------|--------|-------------|
| **New team requests access** | Champion introduces colleagues from another BU | Add seats, add workspace |
| **Governance adoption growing** | Policy packs configured, approval workflows active across projects | Tier upgrade (Team → Professional) |
| **New use case** | Customer asks about compliance reviews, cost optimization, security reviews | Additional workspaces, professional services |
| **Scorecard stretch goals met** | Pilot results exceed targets per [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Multi-year commitment, expanded seat count |
| **Run overage** | Consistently exceeding tier run allowance | Tier upgrade or run pack add-on |

---

## 4. Expansion motion

| Step | Action | Owner |
|------|--------|-------|
| 1 | Identify expansion trigger from health scoring or customer conversation | CSM |
| 2 | Provide champion with updated ROI model populated with actual usage data | CSM |
| 3 | Champion presents value report to CTO/VP (use [ROI_MODEL.md](ROI_MODEL.md) leadership guide) | Customer champion |
| 4 | Technical: provision additional workspaces, configure SSO for new groups | ArchLucid + Customer IT |
| 5 | Commercial: updated order form with new tier/seats/workspaces | Account Exec |

---

## 5. Churn prevention

### At-risk intervention

When health scoring indicates **Red** status:

1. **Immediate:** CSM reaches out within 48 hours with specific, actionable help (not generic check-in).
2. **Root cause:** Diagnose — is it product gap, onboarding failure, champion departure, or budget issue?
3. **Escalation:** Engage account exec and, if accessible, executive sponsor on the customer side.
4. **Recovery plan:** Offer training, dedicated support session, feature guidance, or pilot extension.

### Exit interview

If a customer churns:

- Conduct a **30-minute exit interview** (phone or video, not survey).
- Ask: What did you expect? What was missing? Would you reconsider if X changed?
- Document in CRM and share with product team monthly.

### Win-back

- Maintain a **churned customer list** with reasons and last-known champion.
- On relevant feature releases, send a personalized update to churned champions.
- Offer a **re-trial** (14 days, Professional tier) for customers churned > 6 months ago.

---

## 6. Metrics

| Metric | Target (placeholder) | Definition |
|--------|---------------------|------------|
| **Net revenue retention (NRR)** | > 110% | (Starting ARR + expansion − contraction − churn) / Starting ARR |
| **Gross churn rate** | < 10% annual | Lost ARR / Starting ARR |
| **Expansion revenue %** | > 25% of new bookings | Expansion ARR / Total new ARR |
| **Time-to-renewal-decision** | < 30 days before expiry | Days between first renewal conversation and signed order |

---

## Related documents

| Doc | Use |
|-----|-----|
| [ROI_MODEL.md](ROI_MODEL.md) | ROI for expansion justification |
| [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) | Tiers and expansion levers |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription order form |
| [CUSTOMER_ONBOARDING_PLAYBOOK.md](CUSTOMER_ONBOARDING_PLAYBOOK.md) | Onboarding (feeds renewal readiness) |
| [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Pilot measurement (feeds initial health data) |
| [../library/PRODUCT_LEARNING.md](../library/PRODUCT_LEARNING.md) | Product learning signals |
