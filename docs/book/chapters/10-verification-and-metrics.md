> **Scope:** Chapter 10 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals. The metrics, thresholds, and report layout here are illustrative examples for the reader, not any product's actual rules.
> **Status:** draft

# Chapter 10 — Verification and outcome metrics

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 6,000 words. Azure Policy error codes, Resource Graph change history retention, and GitHub environment API fields must be re-verified against current documentation before submission.*

---

## Three green tickets

In this fictional scenario, the payments team made Chapter 9's three changes in one sprint and closed the three tickets. The security dashboard turned green. The following Monday, the weekly report went further than anyone expected:

> Paths to customer data: 6 → 0.

The plan had promised five of six, with one accepted. The report said all six were gone. The CISO forwarded it to the board risk committee with a one-line note: "Ahead of plan."

The security architect who had built the path analysis read the report again before the committee met, and looked at the manifest behind it. The snapshot had read 10 of 11 expected production subscriptions. The missing one was `sub-payments-prod`, the same subscription that had been invisible in Chapter 3's opening story. During the same sprint, a cleanup script had removed "unused" Reader assignments, including the collector's. With the subscription unreadable, `custdata`, `custarchive`, `pay-reconcile`, and every role assignment in them were missing from the snapshot. No resources, no edges. No edges, no paths. The report counted the absence of evidence as six fixes.

She restored the collector's access and ran an on-demand collection. The real numbers were different:

- **Remove `dev-lead` as app owner:** verified. No path from `dev-lead` to either store.
- **Disable shared key access on `custdata`, with a policy deny:** verified. The setting was off, the policy assignment was in place, and the key route was gone.
- **Replace `helpdesk-07`'s directory role:** the old role was gone, exactly as the ticket said. But the identity team had given the help desk group Application Administrator instead, because "it covers the same tasks in the portal." Application Administrator can add credentials to any application, just like Cloud Application Administrator. The path from `helpdesk-07` to the archive was still open: same entry point, same target, different reason. Its path to `custdata` had closed, but not because of the help desk change. Disabling shared key access had removed the key route underneath it.

One path was open, one was accepted, and four were closed. The ticket for the help desk change had been closed in good faith by someone who had done what it asked. It just hadn't asked for the right thing. It asked for a role to be removed, when the goal was a path that no longer existed.

The committee saw the corrected numbers, with a line explaining the collection gap. The help desk ticket was reopened under the same ID with the verification failure attached, and closed properly two weeks later.

This chapter is about the difference between those two Mondays: what it takes to say a fix worked, and which numbers to report so that progress means less exposure, not more activity.

---

## 10.1 "Fixed" is a claim

Chapter 2 asked, for every statement about a path, what kind of evidence supports it. A fix deserves the same question. The statement "the help desk path is fixed" can rest on very different things:

| Evidence | Category | What it shows |
|----------|----------|---------------|
| The ticket was closed | Human assertion | Someone believes they did what the ticket asked |
| The pipeline applied the Terraform successfully | Observed (the apply ran) | The planned change was made at that moment |
| The Activity Log shows the role assignment deletion | Observed | A specific write happened, by a specific caller, at a specific time |
| The next snapshot shows the setting changed | Observed | The state is now what the change intended |
| A path search on the next snapshot finds no path | Derived | The exposure the change was meant to remove is gone |

Only the last row answers the question the plan asked. The others are useful, and the Activity Log entry in particular is good corroboration of *when* and *who*. But each answers a narrower question. A ticket closure says work was done. An apply log says a change was made. Neither says the path closed.

Three separate questions hide inside "is it fixed?":

1. **Did the change happen?** Check the resource's state in a snapshot taken after the change.
2. **Did the path close?** Re-run the path search on that snapshot.
3. **Does it stay closed?** Repeat both checks on every later snapshot.

The help desk ticket in the opening story passed the first question and failed the second. The shared key change, if someone with Contributor turned it back on next month, would pass the first two and fail the third. Each question needs its own check, and only the snapshot can answer them.

That's why Chapter 7 put "decide a fix is complete" in the column of jobs that belong to code, not a model, and why Chapter 9's recommendation record carried a `verification` field written "in terms the next snapshot can check." This chapter runs those checks.

---

## 10.2 Postconditions

A **postcondition** is a statement that must be true after a change, written so that code can test it against a snapshot. Chapter 9's record for removing `dev-lead` as owner had two:

- "Re-collected snapshot shows no owner of `payments-deploy` other than the platform automation identity."
- "Path search from `user:dev-lead` to read `custdata` and read `custarchive` returns no paths."

Those are two different kinds, and every recommendation should have both:

- A **state postcondition** checks a property of a resource: a setting's value, the presence or absence of a role assignment, an owner, a policy assignment. It answers "did the change happen?"
- A **path postcondition** re-runs the search from Chapter 4 between specific entry points and targets. It answers "did the path close?"

State postconditions are precise and easy to explain. Path postconditions are what the plan actually promised. The opening story is the case for keeping both: the help desk's state postcondition ("Cloud Application Administrator assignment absent") passed, and its path postcondition failed. Had the ticket carried only the state check, the dashboard would still be green.

### Three verdicts, not two

A postcondition check can end three ways:

- **Verified:** the snapshot is newer than the change, it contains everything the check needs, and the check holds.
- **Failed:** the snapshot is newer than the change, it contains everything the check needs, and the check doesn't hold.
- **Not verified:** the snapshot can't answer the question. It started before the change, a file the check needs is missing or incomplete, or the resource the check is about isn't in the snapshot at all.

"Not verified" is Chapter 2's "insufficient evidence" applied to fixes. It's the verdict the opening story's first report should have given, and it's the one most tools leave out. A tool that only knows "passed" and "failed" has to put a missing subscription into one of them, and "nothing found" usually lands in "passed."

### Postconditions as code

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Callable

VERIFIED = "verified"
FAILED = "failed"
NOT_VERIFIED = "not verified"


def parse_utc(value: str) -> datetime:
    """Parse the manifest's UTC timestamps, which end in 'Z'."""
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def incomplete_files(manifest: dict, expected_files: set[str]) -> set[str]:
    """Files the snapshot should contain but doesn't, or that a gap marks as partial."""
    present = {entry["name"] for entry in manifest["files"]}
    partial = {gap["file"] for gap in manifest["gaps"] if "file" in gap}

    return (expected_files - present) | partial


def unreadable_scopes(manifest: dict) -> set[str]:
    return {gap["target"] for gap in manifest["gaps"] if gap["kind"] == "scopeNotReadable"}


@dataclass(frozen=True)
class Postcondition:
    id: str
    text: str                       # what must be true, in words a reviewer can check
    needs: frozenset[str]           # snapshot files the check reads
    scopes: frozenset[str]          # scopes the check depends on, named as in the gap list
    check: Callable[[dict], bool]   # True when the postcondition holds; raise LookupError if the subject is absent


def verify(post: Postcondition, manifest: dict, data: dict, change_applied_at: str, expected_files: set[str]) -> tuple[str, str]:
    """Return (verdict, reason). Anything the snapshot can't answer is NOT_VERIFIED, never VERIFIED."""
    if parse_utc(manifest["collectedAtUtc"]) <= parse_utc(change_applied_at):
        return NOT_VERIFIED, "snapshot collection started before the change was applied"

    missing = sorted(post.needs & incomplete_files(manifest, expected_files))

    if missing:
        return NOT_VERIFIED, "incomplete evidence: " + ", ".join(missing)

    blind = sorted(post.scopes & unreadable_scopes(manifest))

    if blind:
        return NOT_VERIFIED, "scope not readable: " + ", ".join(blind)

    try:
        holds = post.check(data)
    except LookupError as missing_subject:
        return NOT_VERIFIED, f"subject not in snapshot: {missing_subject}"

    return (VERIFIED, post.text) if holds else (FAILED, post.text)
```

`data` maps each snapshot file name to its rows, after the manifest's hashes have been checked (Chapter 3). The gap list is Chapter 3's, with one addition: a gap that affects a single file, such as a throttled query, names that file in a `file` field.

Four details in that code carry most of the weight.

**The snapshot must start after the change.** The comparison uses `collectedAtUtc`, the time collection started, not when it finished. A collection that began at 09:10 and finished at 09:17 may have read the storage account at 09:11. A change applied at 09:12 might or might not be in it. Starting after the change is the only safe rule. Chapter 3 recommended on-demand collection for verification for exactly this reason.

**Missing evidence is checked before the check runs.** If `storage-accounts.json` is partial, a check that reads it isn't run at all. Running it would answer a question about the part of the estate that happened to be collected.

**Unreadable scopes block verification.** That's the opening story's gap. A postcondition about `custdata` depends on `sub-payments-prod`, so it lists that scope, and an unreadable `sub-payments-prod` makes it "not verified" no matter what the rest of the snapshot says.

**An absent subject is not a passing check.** The most common bug in verification code is a check like "every storage account named `custdata` has shared key disabled." If `custdata` isn't in the snapshot, every one of zero accounts passes. Write checks so that a missing subject raises:

```python
def the_row(rows: list[dict], **match: str) -> dict:
    """Exactly one row must match. Zero or several is a question the snapshot can't answer."""
    found = [row for row in rows if all(row.get(key) == value for key, value in match.items())]

    if len(found) != 1:
        raise LookupError(f"{len(found)} rows match {match}")

    return found[0]


shared_key_off = Postcondition(
    id="rec-3c81d0e4/v1",
    text="custdata has shared key access disabled",
    needs=frozenset({"storage-accounts.json"}),
    scopes=frozenset({"subscription sub-payments-prod"}),
    check=lambda data: the_row(data["storage-accounts.json"], name="custdata")["sharedKey"] == "disabled",
)
```

The shared key check also tests `sharedKey == "disabled"` rather than "not enabled". Chapter 3 records an absent property as "not set (platform default)", and Chapter 4's derivation treats that as enabled, because Azure has historically allowed shared key access when the property isn't set. The postcondition has to use the same rule, or the derivation and the verification will disagree about the same row.

### Path postconditions

A path postcondition reuses the search. It depends on every file the derivation reads, because any of them can create an edge:

```python
PATH_FILES = frozenset({
    "transitive-memberships.json", "federated-credentials.json", "service-principals.json",
    "application-owners.json", "directory-role-assignments.json", "compute-identities.json",
    "role-assignments.json", "role-definitions.json", "deny-assignments.json",
    "scope-parents.json", "storage-accounts.json",
})


def no_path(post_id: str, entry: str, target: str, scopes: frozenset[str]) -> Postcondition:
    """Postcondition: the Chapter 4 search, on edges derived from this snapshot, finds nothing."""
    return Postcondition(
        id=post_id,
        text=f"no path from {entry} to {target}",
        needs=PATH_FILES,
        scopes=scopes,
        check=lambda data: not find_paths(data["edges"], entry, target, max_hops=12),
    )
```

`data["edges"]` is the output of the Chapter 4 loader run on the same snapshot, and `find_paths` is Chapter 4's search. As in Chapter 9's verification, the hop limit is higher than the discovery search's. Verification asks a yes-or-no question about one pair, so it can afford to look further.

### Writing good postconditions

The postconditions decide what "fixed" means, so they deserve the same review as the change itself:

- **Write them before the change.** A postcondition written afterward tends to describe what was done, not what was needed. The help desk ticket's would have said "Cloud Application Administrator removed."
- **Check the outcome, not the method.** "No path from `helpdesk-07` to read `custarchive`" stays correct whatever the identity team chooses to do. "Role X removed" is correct only if role X was the only way.
- **Name the scope.** Every postcondition should list the scopes it depends on, so a gap there makes it "not verified" rather than vacuously true.
- **Include durability.** For configuration changes, add a state postcondition for whatever keeps the change in place. For the shared key change, that's the policy assignment: present, at the right scope, with a deny effect.

---

## 10.3 Comparing snapshots

Postconditions check what a recommendation promised. A **snapshot diff** checks everything else: which paths closed, which persisted, and which appeared, between two snapshots. It catches the effects nobody wrote a postcondition for, including new paths that a fix created.

To compare paths across snapshots, each path needs an identity that doesn't depend on the run. The sequence of edge keys works: source, kind, and target for each hop. That's Chapter 9's `edge_key`, so a path's signature is stable as long as the same identities hold the same kinds of capability.

A path that disappears isn't necessarily closed. If the evidence that produced one of its edges is incomplete in the later snapshot, the honest status is "unresolved." To decide that, the diff needs to know which files each edge kind comes from. Chapter 4's lab listed them:

```python
KIND_SOURCES = {
    "memberOf": {"transitive-memberships.json"},
    "canSignInAs": {"federated-credentials.json"},
    "canAddCredential": {"application-owners.json", "directory-role-assignments.json"},
    "appFor": {"service-principals.json"},
    "runsAs": {"compute-identities.json"},
    "canControlCode": {"role-assignments.json", "role-definitions.json", "deny-assignments.json",
                       "scope-parents.json", "transitive-memberships.json", "compute-identities.json"},
    "grants": {"role-assignments.json", "role-definitions.json", "deny-assignments.json",
               "scope-parents.json", "transitive-memberships.json", "storage-accounts.json"},
}


def path_signature(path: list[Edge]) -> tuple[tuple[str, str, str], ...]:
    return tuple(edge_key(edge) for edge in path)


def diff_paths(before: list[list[Edge]], after: list[list[Edge]], incomplete: set[str]) -> dict[str, list]:
    """Classify paths between two snapshots. A missing path counts as closed only if its evidence was complete."""
    after_by_signature = {path_signature(path): path for path in after}
    before_signatures = {path_signature(path) for path in before}
    result: dict[str, list] = {"closed": [], "unresolved": [], "persisted": [], "new": []}

    for path in before:
        later = after_by_signature.get(path_signature(path))

        if later is not None:
            # Same hops, possibly for a different reason. Report what changed in the citations.
            changed = [(old.detail, new.detail) for old, new in zip(path, later) if old.detail != new.detail]
            result["persisted"].append((path, changed))
        elif any(KIND_SOURCES[edge.kind] & incomplete for edge in path):
            result["unresolved"].append(path)
        else:
            result["closed"].append(path)

    result["new"] = [path for path in after if path_signature(path) not in before_signatures]

    return result


# Files collected per subscription. Graph files don't depend on Azure scope.
SUBSCRIPTION_FILES = frozenset({
    "role-assignments.json", "role-definitions.json", "deny-assignments.json",
    "scope-parents.json", "storage-accounts.json", "compute-identities.json",
})


def files_in_doubt(manifest: dict, expected_files: set[str]) -> set[str]:
    """Partial or missing files, plus every per-subscription file if any subscription was unreadable."""
    doubtful = incomplete_files(manifest, expected_files)

    if unreadable_scopes(manifest):
        doubtful |= SUBSCRIPTION_FILES

    return doubtful
```

Call `diff_paths` with `files_in_doubt` for the later snapshot. One unreadable subscription puts every Azure file in doubt, which is deliberately coarse. A finer version records which subscription each edge's resources live in and doubts only the edges in unreadable ones. Start coarse. A wrong "closed" costs more than a delayed one.

`KIND_SOURCES` covers the kinds the payments graph uses. Add the others (`ownerOf`, `canActivate`, `canAssignRoles`) as your loader emits them. An unknown kind raises `KeyError`, the same way Chapter 9's ranking refuses an unknown level. Guessing which files an edge came from would quietly turn gaps into fixes.

The opening story's two Mondays run through this function very differently.

**The first snapshot** had `sub-payments-prod` unreadable. Every role assignment, storage account, and compute identity in that subscription was missing, so `files_in_doubt` returns every per-subscription file. Every one of the six paths ends in a `grants` edge, which comes from those files, so all six come out "unresolved." Not one comes out "closed."

**The on-demand snapshot** was complete. P1, P2, P3, and P5 come out "closed." P4 comes out "persisted," as the plan expected, and it's covered by the risk acceptance (section 10.4). P6 also comes out "persisted," with a changed citation on its first hop:

```text
P6 persisted
  hop 1  user:helpdesk-07 -canAddCredential-> app:payments-deploy
         before: directory-role-assignments.json row 41 (Cloud Application Administrator, scope /)
         after:  directory-role-assignments.json row 57 (Application Administrator, scope /, via group helpdesk-tier2)
```

That changed citation is the most useful line in the report. It says the fix happened and the exposure didn't change, and it says why.

P3 is the opposite case. Chapter 9's plan assigned it to the help desk change, which failed. It closed anyway, because the shared key change removed its last hop. The diff reports it as closed, which is true. A tracker that credits closures to the tickets that planned them would report P3 as still open, because its ticket failed. Credit closures to the evidence, not the plan. When it matters which change closed a path, for example to decide whether a change can be rolled back, re-run the search with only that change reverted.

The helpdesk path keeps the same signature because `canAddCredential` doesn't record which role produced it. That's deliberate: the path graph describes capability, and the capability is the same. The reason lives in the edge's citation, which is where the diff looks for it.

### New paths

The `new` list matters as much as the `closed` list. Fixes create paths. An identity team replacing one role with another, a platform team moving a deployment to a new identity, or a developer adding a managed identity to get around a removed key can each open a path that wasn't there last week. If the report only tracks the paths it was asked to close, these stay invisible until the next full review.

Treat every new path to a high-consequence target as a finding in its own right, ranked with Chapter 9's rules. If a new path appears in the same snapshot as a planned change, check whether the change caused it. A path that runs through the identity or resource the change touched is the usual sign.

### Resource Graph change history

Azure Resource Graph keeps recent property changes for many resource types (Chapter 3). It can tell you *when* `custdata`'s shared key setting changed between two snapshots, and sometimes who changed it. That's useful corroboration, and it helps explain diffs. It isn't a substitute for the snapshot: its retention is limited, it doesn't cover directory objects such as app owners and directory roles, and it records changes, not the full state you need to re-run a path search.

> **As of 2026-10:** Verify Resource Graph change history (`resourcechanges`) retention, which resource types it covers, and whether it records the caller.

---

## 10.4 Gaps: when the honest answer is "not verified"

The opening story's first report is the most common verification failure, and the most dangerous one, because it points in the direction everyone hopes for. Missing data almost always looks like improvement. Fewer resources means fewer edges, fewer edges means fewer paths, and fewer paths reads as progress.

Chapter 2 called the equivalent scoring error the zero trap: an unknown value treated as zero. In verification, the unknown is the state of a resource you couldn't read, and treating it as "no path" is the same mistake. The defenses are the ones already in the code:

- **Postconditions list their files and scopes**, so a gap in either makes them "not verified."
- **The diff classifies disappeared paths as unresolved** when their evidence is incomplete.
- **Every report carries the manifest's coverage line**, such as "10 of 11 expected subscriptions read," next to the numbers it affects.

Two practices make gaps rarer in the first place.

**Protect the collector's access as a dependency.** The opening story's gap came from a cleanup script that removed a role assignment it didn't recognize. Tag the collector's assignments, exclude them from automated cleanup, and alert when the collector's own scope count drops. A collector that loses access is an outage for every number built on it, and it should be treated like one.

**Collect on demand for verification.** A weekly schedule means a fix applied on Tuesday isn't verified until the next Monday, at the earliest. A collection triggered by the change pipeline, or by the ticket moving to "resolved," verifies it within the hour. It only needs the files the postconditions name, plus the derivation inputs for path postconditions, so it can be much smaller than a full collection.

### Accepted risk needs verification too

Chapter 9 left P4 open under a risk acceptance with checkable compensating controls and an expiry date. Each of those is a postcondition, checked on every snapshot:

- "The GitHub `production` environment requires at least two reviewers." This is a state postcondition against data collected from GitHub, not Azure. The collector reads the environment's protection rules.
- "`mi-pay-reconcile` holds Storage Blob Data Reader on one container only, not the whole account."
- "Today is before the acceptance's expiry date."

If any of them fails, or becomes "not verified," the acceptance lapses and P4 counts as open in every metric. The register entry isn't deleted. It's marked lapsed, with the failing check, and the owner is asked to renew or act. That's what makes an acceptance a control rather than a comment.

> **As of 2026-10:** Verify the GitHub REST API fields for environment protection rules and required reviewers.

---

## 10.5 Regressions

Verification isn't a single event. A postcondition that was verified last week can fail this week, because someone reverted a change, a pipeline reapplied an old configuration, or a new role assignment re-created an edge. That's a **regression**, and it's the third question from section 10.1: does it stay closed?

The mechanics are simple once postconditions exist. Re-check every verified postcondition on every snapshot. When one fails, reopen the recommendation's ticket under its stable ID (Chapter 9), attach the failing check and the diff, and record the regression. Don't open a new ticket. The history of the recommendation, including the earlier verification, is part of the evidence.

Regressions are where Chapter 9's durability analysis pays off. A durable cut, one that no identity still on a path can reverse, shouldn't regress through an attacker. It can still regress through drift, for example when a team's Terraform still has `shared_access_key_enabled = true` and the next apply runs. The Azure Policy deny assignment would reject that apply, which surfaces the drift as a failed deployment instead of a silent reversal. The Activity Log records the denied write.

> **As of 2026-10:** Verify the error code Azure returns when a policy with a deny effect blocks a write (`RequestDisallowedByPolicy`) and how it appears in the Activity Log.

A denied write isn't a regression. The postcondition still holds. But it's worth a ticket to the owning team, because their code disagrees with the environment, and the next person to "fix" the failed pipeline may try to remove the policy.

---

## 10.6 Measuring outcomes, not activity

### Why "findings closed" is a weak headline

Most security programs report activity: findings opened, findings closed, percentage remediated within the target time. Those numbers are easy to collect and easy to improve. That's the problem.

- **Closure is a human assertion.** A closed finding means someone marked it closed. The opening story's help desk ticket was closed, and the paths were still open.
- **Findings aren't exposure.** Chapter 1's checklist problem applies to metrics too. Forty findings on the payments estate didn't correspond to forty units of risk. Closing the thirty-seven easiest could leave every path intact.
- **The denominator moves.** Turn on a new scanner rule and "percentage remediated" drops. Suppress a noisy rule and it rises. Neither changed the estate.
- **The metric invites the wrong work.** When the measure is "findings closed," the rational move is to close easy findings first. That's Goodhart's law: a measure that becomes a target stops measuring what it used to.

None of that makes finding counts useless. They're a reasonable measure of workload. They just shouldn't be the headline for whether the estate is safer.

### Outcome metrics

An outcome metric goes down only when exposure goes down. The paths from earlier chapters give several:

| Metric | What it measures | Notes |
|--------|------------------|-------|
| **Open paths to high-consequence targets** | Current exposure | Count accepted paths separately. Report by target. |
| **Entry–target pairs** | Breadth of exposure | Distinct (entry point, target) pairs with at least one open path. Less sensitive to path explosion. |
| **Entry points that reach a high-consequence target** | Who can start an attack that matters | Count identities and entry points, not paths. |
| **Time a critical path stayed open** | How long exposure lasted | From first observed open to first verified closed, reported as bounds. |
| **Time to verify** | Whether verification keeps up | From the ticket's resolution to the first verified postcondition. |
| **Regression rate** | Whether fixes hold | Verified postconditions that later failed, per period. |
| **Coverage** | How much of the estate the numbers describe | Subscriptions read against expected, and each gap. Shown with every other number. |

### Counting paths carefully

Raw path counts have a known weakness: they multiply. If a group with 400 members holds a role that opens a path, the search returns 400 paths, one per member. Remove one member and the count drops by one. Remove the group's role and it drops by 400. Neither number tells a reader how much exposure changed.

Report path counts with two companions. **Entry–target pairs** count each (entry point, target) combination once, however many routes connect them. **Cut points** count the distinct changes that would close the remaining paths, using Chapter 9's plan. For the payments estate after the corrected Monday, those were:

- Open paths: 1 (P6), plus 1 accepted (P4).
- Entry–target pairs: 1 open (`helpdesk-07` to the archive), plus 1 accepted.
- Changes needed to close the open ones: 1 (the help desk's directory role).

A reader who sees "1 open path, 1 change away from 0" understands the state of the estate. A reader who sees "37 of 40 findings closed" doesn't.

### Exposure windows with honest bounds

"How long was this path open?" sounds like a simple subtraction. With snapshots, it isn't. You never see the moment a path opened or closed. You see it open in one snapshot and closed in a later one, and the change happened somewhere in between. A gap snapshot in the middle tells you nothing either way.

Report the window as bounds:

```python
from datetime import timedelta


def open_intervals(observations: list[tuple[str, str]]) -> list[dict]:
    """observations: (snapshot collectedAtUtc, 'open' | 'closed' | 'unknown') for one path, in any order."""
    intervals: list[dict] = []
    current: dict | None = None
    last_closed: str | None = None

    for at, state in sorted(observations, key=lambda item: parse_utc(item[0])):
        if state == "open":
            if current is None:
                current = {"lastSeenClosedBefore": last_closed, "firstSeenOpen": at, "lastSeenOpen": at, "firstSeenClosed": None}

            current["lastSeenOpen"] = at
        elif state == "closed":
            if current is not None:
                current["firstSeenClosed"] = at
                intervals.append(current)
                current = None

            last_closed = at

        # 'unknown' (a gap) neither opens nor closes an interval.

    if current is not None:
        intervals.append(current)

    return intervals


def open_duration_bounds(interval: dict, now: str) -> tuple[timedelta, timedelta | None]:
    """At least: first to last time seen open. At most: last seen closed before, to first seen closed after (or now)."""
    lower = parse_utc(interval["lastSeenOpen"]) - parse_utc(interval["firstSeenOpen"])

    if interval["lastSeenClosedBefore"] is None:
        return lower, None

    end = interval["firstSeenClosed"] or now

    return lower, parse_utc(end) - parse_utc(interval["lastSeenClosedBefore"])
```

The lower bound is what you observed. The upper bound needs a snapshot showing the path closed before it opened. Without one, the path may have existed long before your first collection, and the honest upper bound is "unknown." That's the normal case for anything found in a first review: the payments paths were open for *at least* the time between the first snapshot that showed them and the fix, and for an unknown time before that.

A gap snapshot is "unknown," not "closed." In the opening story, the Monday snapshot with `sub-payments-prod` unreadable doesn't end P6's interval. The on-demand snapshot that showed it still open extends it.

Report windows as "open at least 23 days" or "open between 23 and 30 days," never as a single number with false precision. Chapter 8's warning about fake precision applies to dates as much as probabilities.

### Every number carries its snapshot

Each metric should be stated with the snapshot ID it came from, the ruleset version that ranked it (Chapter 9), and the coverage line. "1 open path to customer data" is a claim. "1 open path to customer data, snapshot 2026-10-20T14-02-00Z-prod, 11 of 11 subscriptions read" is evidence.

---

## 10.7 Reporting to people who decide

Executives, auditors, and boards need the outcome, the trend, what's left, and how much to trust it. One page is enough when the page is built from the metrics above.

```text
Payments estate: paths to customer data          Snapshot 2026-10-20T14-02-00Z-prod
                                                 Coverage: 11 of 11 production subscriptions
                                                 Ranking ruleset: contoso-path-ranking-2026-10-01

Open paths to customer data          6  →  1     (start of quarter → now)
Accepted, with controls verified     0  →  1     P4, accepted until 2027-04-01
Changes needed to close the rest           1     Help desk directory role (ticket rec-5e09b7a1, reopened)

What changed
  Verified closed: P1, P2, P3, P5 (owner removal; shared key disabled with policy deny)
  Fix applied but path still open: P6 (replacement role also allows adding credentials)
  New paths: none

Exposure windows
  P2 (dev-lead to custdata): open at least 19 days; unknown before first collection
  P6 (helpdesk-07 to custarchive): still open; at least 33 days

Not verified this period
  None. Last period's report was based on a snapshot missing sub-payments-prod;
  its "6 → 0" figure was withdrawn.
```

That page follows the rules from the rest of the book:

- **Every number comes from code.** The counts, the windows, and the verdicts are computed from snapshots. None are estimated.
- **Bounds, not points.** The windows say "at least" where that's all the evidence supports.
- **Gaps are on the page.** The coverage line is in the header, and the withdrawn figure is reported, not quietly replaced.
- **Accepted risk is visible.** P4 isn't hidden in the "closed" count. Its controls are verified on every snapshot, and the page says so.
- **What failed is stated plainly.** "Fix applied but path still open" is more useful to a board than a green tick. It shows the verification is real.

Avoid the two patterns that make reports untrustworthy: a single composite "risk score" that hides which parts moved, and a trend line drawn through snapshots of different coverage. If coverage changed between two points, say so, or compare only the part of the estate both snapshots covered.

---

## 10.8 Where AI fits

Verification is the part of the loop where models matter least, and that's the point. The verdicts must be repeatable, and anyone must be able to check them. The jobs a model can do sit around the edges:

- **Drafting postconditions.** Given a recommendation record, a model can propose state and path postconditions, including the ones a busy engineer forgets, such as the policy assignment that keeps a change durable. A person reviews them, and each one must compile into a `Postcondition` with named files and scopes. A drafted postcondition that can't be expressed as a check isn't a postcondition.
- **Explaining a failed verification.** Given the diff for P6, with its before and after citations, a model can write the ticket comment: what changed, why the path persisted, and what the identity team might do instead. Chapter 7's grounding pattern applies, with the diff as the evidence pack.
- **Writing the report prose.** The one-pager's sentences can be drafted from the computed metrics, with Chapter 7's validator enforcing that every number appears in the pack. The model writes "one path remains open." The code decided it was one.
- **Summarizing patterns across regressions.** "Most regressions this quarter came from Terraform reapplying old settings" is a useful observation over a structured log of regression records.

And the jobs models shouldn't do:

- **Deciding whether something is fixed.** That's the verdict function, run on a snapshot.
- **Computing or estimating metrics.** Counts, windows, and coverage are arithmetic on evidence. A model asked "roughly how long was this path open?" will give a confident number, and it will be a guess.
- **Filling in missing snapshots.** A gap is "unknown." A model asked to interpolate it will produce something plausible, which is worse than nothing.
- **Choosing what counts as a high-consequence target.** That's a human assertion, as in Chapter 9's ranking rules.

---

## 10.9 Lab: verify the payments plan

This lab applies Chapter 9's changes in the lab tenant, re-collects, and verifies them, including one fix that doesn't work. It uses the companion lab tenant (Appendix A), the Chapter 3 collector with Chapter 4's Step 0, and the recommendation records from Chapter 9's lab.

**Step 1 — Write the postconditions.** For each of the three recommendation records, write at least one state postcondition and one path postcondition as `Postcondition` objects, with their files and scopes. For the shared key change, add a state postcondition for the policy assignment. For P4's risk acceptance, write a postcondition for each compensating control and one for the expiry date.

**Step 2 — Verify against the old snapshot.** Run `verify` on every postcondition using the snapshot from Chapter 9's lab and the current time as the change time. Every verdict must be "not verified," because the snapshot started before the change. If any comes back verified or failed, your time comparison is wrong.

**Step 3 — Apply the changes.** Apply the Chapter 9 Terraform and the runbook steps. For the help desk change, reproduce the opening story: remove Cloud Application Administrator from `helpdesk-07`, then add a group `helpdesk-tier2` with `helpdesk-07` as a member, and assign the group Application Administrator at tenant scope. Record when each change was applied.

**Step 4 — Re-collect and verify.** Run an on-demand collection, the derivation from Chapter 4, and `verify`. Confirm:

- The owner removal and shared key postconditions are verified, including the policy assignment.
- The help desk state postcondition ("Cloud Application Administrator assignment absent") is verified.
- The help desk path postcondition for `custarchive` fails. Its path postcondition for `custdata` is verified, because the shared key change closed that path.

**Step 5 — Diff.** Run `diff_paths` between the Chapter 9 snapshot and this one. Confirm that P1, P2, P3, and P5 are closed, that P4 persisted, and that P6 persisted with a changed citation on its first hop. Print the citation change. Then revert only the shared key change in a copy of the edges and search again, to see which change actually closed P3.

**Step 6 — Simulate the gap.** Copy the new snapshot, remove the collector's Reader access to the lab's payments subscription, and re-collect into the copy. Confirm the manifest records a `scopeNotReadable` gap. Run the diff again, and confirm that all six paths come out "unresolved" and none "closed." Run `verify`, and confirm that every postcondition scoped to that subscription is "not verified." Restore the access.

**Step 7 — Test durability.** As a user with Contributor on the resource group, try to re-enable shared key access on `custdata`. Confirm that the policy denies the write, and find the denied operation in the Activity Log. Then, as a user who can delete policy assignments (Owner, or Resource Policy Contributor), remove the policy assignment, re-enable shared key access, and re-collect. Confirm that the shared key postcondition is now a regression and that the diff lists P1 as new again. Restore the setting and the policy.

**Step 8 — Fix the help desk properly.** Replace the group's Application Administrator assignment with a role that can't add credentials to applications, or with an administrative unit scope that excludes `payments-deploy`. Agree the choice with whoever runs your help desk. Re-collect, and confirm the path postconditions are now verified.

**Step 9 — Report.** Record each path's states across the lab's snapshots, run `open_intervals` and `open_duration_bounds`, and produce the one-pager from section 10.7 for your lab. Draft its prose with a model through Chapter 7's pipeline, and run the validator. Every number in the prose must come from the computed metrics.

**What you should see.** The fix that removed the role you named passes its state check and fails its path check. A missing subscription turns every verdict about it into "not verified" rather than "passed." The policy turns an attacker's reversal into a denied write, and only someone who can remove policy assignments can produce a regression. The one-pager's numbers all trace to snapshots, with coverage stated.

---

## Summary

- **"Fixed" is a claim.** Ticket closure is a human assertion, and an apply log shows a change was made. Only a snapshot taken after the change shows that the state changed and the path closed.
- Ask three questions: **did the change happen, did the path close, and does it stay closed?** Each needs its own check.
- Write **postconditions** before the change, at two levels: **state** (a resource property) and **path** (the Chapter 4 search between named entry points and targets). Check the outcome, not the method.
- Use three verdicts: **verified, failed, and not verified.** A snapshot that started before the change, an incomplete file, an unreadable scope, or a missing subject means "not verified," never "verified."
- **Diff snapshots** to find closed, persisted, unresolved, and new paths. A path that disappears with incomplete evidence is unresolved. A persisted path with a changed citation shows a fix that didn't remove the exposure.
- **Missing data looks like improvement.** Protect the collector's access, collect on demand for verification, and show coverage next to every number.
- **Verify accepted risk** on every snapshot: compensating controls and expiry are postconditions, and a failure lapses the acceptance.
- Re-check verified postconditions on every snapshot to catch **regressions**, and reopen the same ticket under its stable ID.
- Report **outcomes, not activity**: open paths to high-consequence targets, entry–target pairs, entry points, changes still needed, exposure windows as **bounds**, time to verify, regression rate, and coverage.
- Use AI to **draft** postconditions, explanations, and report prose from computed results. Never to decide a verdict, compute a metric, or fill a gap.

## Key terms

- **Postcondition** — a statement that must be true after a change, written so that code can test it against a snapshot.
- **State postcondition** — a postcondition about a resource property, such as a setting, assignment, owner, or policy.
- **Path postcondition** — a postcondition that re-runs the path search between named entry points and targets.
- **Not verified** — the verdict when the snapshot can't answer the question; Chapter 2's "insufficient evidence" applied to fixes.
- **Snapshot diff** — the classification of paths between two snapshots as closed, persisted, unresolved, or new.
- **Regression** — a verified postcondition that fails on a later snapshot.
- **Outcome metric** — a measure that decreases only when exposure decreases.
- **Exposure window** — how long a path was open, reported as observed lower and upper bounds.
- **Coverage** — the part of the estate a snapshot actually read, compared with what was expected.

---

## Author notes (remove before submission)

- The opening story, dates, durations, recommendation IDs, and report layout are illustrative and fictional. Keep the scope header's statement that they aren't any product's rules.
- Verify: `RequestDisallowedByPolicy` and how denied writes appear in the Activity Log; Resource Graph `resourcechanges` retention, coverage, and caller information; GitHub REST API fields for environment protection rules.
- Verify: Application Administrator's ability to add credentials to any application, matching Chapter 4's rule 4.
- Verify: which built-in roles can delete policy assignments (Owner, Resource Policy Contributor, User Access Administrator), for lab Step 7.
- Consider a figure showing the exposure-window bounds on a timeline of snapshots.
- Add the Chapter 10 fact checks to GTM **M-306** when it is picked up.
