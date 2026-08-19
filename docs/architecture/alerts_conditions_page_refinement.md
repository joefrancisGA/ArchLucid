# Alerts Conditions tab refinement (`/governance/alert-rules`)

**Backlog:** TB-936 (Done 2026-07-22)  
**Route:** `/governance/alert-rules?tab=rules` (default tab)  
**Workbook:** GLR / GOA

## Summary

Refined the **Conditions** tab on the Alerts configuration hub so authorized workspace users can understand what a rule monitors, when it triggers, how alert priority differs from finding severity, and whether external notification destinations are configured — without exposing internal enum names or implying that creating a condition configures delivery.

## Discovered alert-rule model

| Field | UI treatment |
| --- | --- |
| `ruleType` | Buyer labels via `ALERT_RULE_TYPE_OPTIONS` (finding vocabulary for count rules) |
| `severity` | Shown as **Alert priority** with explicit help text |
| `thresholdValue` | Integer for count/day rules; decimal for `%` rules; hidden for rejected-security |
| `isEnabled` | **Active** / **Paused** in list rows |
| Scope | Server stamps tenant/workspace/project; UI describes workspace eligibility |
| `targetChannelType` | Not surfaced; readiness uses routing subscriptions instead |

Engine comparison semantics (from `AlertEvaluator`):

- Count / gap / cost rules: **at least** threshold (`>=`)
- Acceptance rate: **falls below** threshold (`<=`)
- Rejected security: fires per rejected security finding (threshold unused)
- Deferred high-priority age: days open **longer than** threshold

## Terminology map

| Before | After |
| --- | --- |
| Critical / high recommendation count | Critical and high-severity finding count |
| Severity (when triggered) | Alert priority |
| Change configuration | Create alert rule |
| Current rules | Alert rules |
| Threshold value | Plain-language comparison label per rule type |

## Notification readiness

- **In-app:** enabled for active rules (Alerts inbox)
- **External:** `listAlertRoutingSubscriptions()` — any enabled subscription counts as configured
- Link to **Notifications** tab when external delivery is not configured

## Sample mode

When `isBuyerPolishedOperatorShellEnv()` and not full architect workspace: read-only banner, disabled create, Start an evaluation CTA.

## Files changed

- `archlucid-ui/src/lib/alert-rule-conditions.ts` (+ tests)
- `archlucid-ui/src/lib/alert-rule-conditions-copy.ts`
- `archlucid-ui/src/components/alerts/AlertRulesContent.tsx`
- `archlucid-ui/src/components/alerts/AlertRuleListRow.tsx`
- `archlucid-ui/src/components/alerts/AlertRuleLivePreviewPanel.tsx`
- `archlucid-ui/src/components/alerts/AlertRuleNotificationReadinessPanel.tsx`
- `archlucid-ui/src/app/(operator)/governance/alert-rules/AlertRulesHubClient.tsx`
- Tests: `AlertRulesContent.test.tsx`, `AlertRulesContent.sample-mode.test.tsx`, `operate-authority-ui-shaping.test.tsx`

## Remaining engine limitations (not in scope)

- No update/delete/pause API for simple alert rules — list actions limited to **Test rule** (simulate)
- No per-rule last-triggered timestamp in list DTO
- Review lifecycle picker not exposed (engine evaluates completed reviews in scope only)

## Tests run

- `npx vitest run src/lib/alert-rule-conditions.test.ts src/components/alerts/AlertRulesContent.test.tsx src/components/alerts/AlertRulesContent.sample-mode.test.tsx`
- Updated `operate-authority-ui-shaping.test.tsx` alert-rules cases
