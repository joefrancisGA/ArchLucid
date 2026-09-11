> **Scope:** Compat matrix — AS-076–085 **shipped** vs remaining Career-gravity leak rows from CG-002–009. **Do not re-implement AS-076–085 bodies.**

> **Spine:** ADR **0086** · ADR **0091** · `ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md` · CG-010

# Career-gravity leftover matrix (AS-076–085)

**Last reviewed:** 2026-09-11

Prevents re-running AS-077 chooser while leftover Ready copy, unlabeled exports, outbound, and nested tools still ship.

**Do not re-run AS-076–085.** Career vs Rehearsal stays product chrome plus run stamp, not a host-config flip. No G-REAL-06.

## Matrix

| AS | Prompt file | Shipped? | What it already did | Remaining leak (do this instead) |
|----|-------------|----------|---------------------|----------------------------------|
| **076** | `.cursor/prompts/architecture-spine-076-adr-0086-career-vs-rehearsal-doors.md` | **Yes** — ADR **0086** | Doors exist; host Mode stays Simulator | **CG-001** (ADR **0091** Working gravity). Do **not** rewrite 0086 |
| **077** | `.cursor/prompts/architecture-spine-077-working-chrome-mode-chooser.md` | **Yes** — `WorkingCareerRehearsalChooser` | Chooser chrome | **CG-016** keyboard/Carbon; **CG-017** Security skip honesty strip (chooser stays skipped). **Do not re-run the chooser.** Ready leaks are **CG-002 / CG-004 / CG-030** |
| **078** | `.cursor/prompts/architecture-spine-078-career-door-requires-real-or-blocked.md` | **Yes** | Career without Real is honesty-blocked in chrome | **CG-020** door vs Mode mismatch; **CG-021** finalize gate |
| **079** | `.cursor/prompts/architecture-spine-079-cannot-screenshot-simulator-ready.md` | **Yes** — helper suppression when wired | Ready suppressed **when honesty options are passed** | **CG-002 / CG-004** bypass call sites; **CG-030 / CG-031** leftover copy |
| **080** | `.cursor/prompts/architecture-spine-080-new-working-tenants-career-intent.md` | **Yes** | New tenants Career; grandfather Rehearsal | **CG-014 / CG-015** server persist + clone banner |
| **081** | `.cursor/prompts/architecture-spine-081-guided-keeps-simulator-teaching.md` | **Yes** | Guided/demo keep Simulator teaching | **CG-052** ratchet leftover. Do not evict Guided teaching |
| **082** | `.cursor/prompts/architecture-spine-082-help-rehearsal-vs-career.md` | **Yes** | Help topic | **CG-053** expansion leftover |
| **083** | `.cursor/prompts/architecture-spine-083-cli-try-real-vs-rehearse.md` | **Yes** — `try --rehearse \| --real` | CLI doors on **try** | **CG-005** unlabeled execute/finalize; **CG-054 / CG-055** leftover |
| **084** | `.cursor/prompts/architecture-spine-084-tests-career-rehearsal-chrome.md` | **Yes** | Vitest chrome matrix | **CG-046** Playwright Ready ratchet leftover |
| **085** | `.cursor/prompts/architecture-spine-085-no-host-mode-flip-ratchet.md` | **Yes** | Host Mode default Simulator ratchet | **None** — keep the ratchet. CG must **not** flip `AgentExecution:Mode` |

## Inventories this matrix indexes (CG-002–009)

| CG | Inventory | Typical leftover vs AS-077 |
|----|-----------|----------------------------|
| **002** | [`CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md`](CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md) | Ready literals that skip the AS-079 helper |
| **003** | [`CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY.md`](CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY.md) | Export bytes; chooser does not watermark PDFs |
| **004** | [`CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY.md`](CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY.md) | Badge screenshots; Security skip |
| **005** | [`CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY.md`](CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY.md) | Curl/CLI without door (AS-083 only covers `try`) |
| **006** | [`CAREER_GRAVITY_OUTBOUND_INVENTORY.md`](CAREER_GRAVITY_OUTBOUND_INVENTORY.md) | Digest / ITSM / alerts |
| **007** | [`CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY.md`](CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY.md) | Nested tools do not read the chooser |
| **008** | [`CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY.md`](CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY.md) | All-day verbs unlabeled |
| **009** | [`CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY.md`](CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY.md) | Sponsor KPIs; chooser never shown |

## Reviewer line (quote this)

**Do not re-run AS-077.** The chooser shipped. Leftover Ready copy, unlabeled exports, outbound packets, nested Ask, and sponsor KPIs are **CG-002–CG-009** rows, not a missing chooser.

## Shrink rules

1. **Do not re-implement** AS-076–085 prompt bodies.
2. Ratchet: `career-gravity-as076-leftover-matrix.test.ts`.

## Intentional — do not “fix” from this inventory

- Host `AgentExecution:Mode` default Simulator.
- Desktop review **More** menu.
- G-REAL-06.
