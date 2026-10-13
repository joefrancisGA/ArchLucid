"""Chapter 12 listings: postconditions, snapshot diffs, and exposure windows.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch12_verification.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations

from ch05_paths import KIND_SOURCES, Edge, find_paths, parse_utc, read_windows, unmodeled_on
from ch11_remediation import edge_key


# region verify
from dataclasses import dataclass
from typing import Callable

VERIFIED = "verified"
FAILED = "failed"
NOT_VERIFIED = "not verified"


def incomplete_files(manifest: dict, expected_files: set[str]) -> set[str]:
    """Files the snapshot should contain but doesn't, or that a gap marks as partial."""
    present = {entry["name"] for entry in manifest["files"]}
    partial = {gap["file"] for gap in manifest["gaps"] if "file" in gap}

    return (expected_files - present) | partial


def unreadable_scopes(manifest: dict) -> set[str]:
    return {gap["target"] for gap in manifest["gaps"] if gap["kind"] == "scopeNotReadable"}


class Unmodeled(Exception):
    """Raised by a check whose answer depends on a control the analysis doesn't evaluate."""


@dataclass(frozen=True)
class Postcondition:
    id: str
    text: str                       # what must be true, in words a reviewer can check
    needs: frozenset[str]           # snapshot files the check reads
    scopes: frozenset[str]          # scopes the check depends on, named as in the gap list
    # True when the postcondition holds. Raise LookupError if the subject is absent, or
    # Unmodeled if the answer depends on an unevaluated control (Chapter 5).
    check: Callable[[dict], bool]


def verify(
    post: Postcondition,
    manifest: dict,
    data: dict,
    change_applied_at: str,
    expected_files: set[str],
) -> tuple[str, str]:
    """Return (verdict, reason).

    Anything the snapshot can't answer is NOT_VERIFIED, never VERIFIED.
    """
    missing = sorted(post.needs & incomplete_files(manifest, expected_files))

    if missing:
        return NOT_VERIFIED, "incomplete evidence: " + ", ".join(missing)

    # Every input must have been read after the change. Inputs that straddle it describe
    # no single state of the estate.
    windows = read_windows(manifest)
    changed_at = parse_utc(change_applied_at)
    stale = sorted(name for name in post.needs if windows[name][0] <= changed_at)

    if stale:
        return NOT_VERIFIED, "read before the change was applied: " + ", ".join(stale)

    blind = sorted(post.scopes & unreadable_scopes(manifest))

    if blind:
        return NOT_VERIFIED, "scope not readable: " + ", ".join(blind)

    try:
        holds = post.check(data)
    except LookupError as missing_subject:
        return NOT_VERIFIED, f"subject not in snapshot: {missing_subject}"
    except Unmodeled as control:
        return NOT_VERIFIED, f"depends on an unmodeled control: {control}"

    return (VERIFIED, post.text) if holds else (FAILED, post.text)
# endregion verify


# region the_row
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
    check=lambda data: (
        the_row(data["storage-accounts.json"], name="custdata")["sharedKey"] == "disabled"
    ),
)
# endregion the_row


# region no_path
PATH_FILES = frozenset({
    "transitive-memberships.json", "federated-credentials.json", "service-principals.json",
    "application-owners.json", "directory-role-assignments.json", "compute-identities.json",
    "role-assignments.json", "role-definitions.json", "deny-assignments.json",
    "scope-parents.json", "storage-accounts.json",
})


def no_path(post_id: str, entry: str, target: str, scopes: frozenset[str]) -> Postcondition:
    """Postcondition: the Chapter 5 search, on edges derived from this snapshot, finds nothing.

    A remaining path that rests only on unmodeled controls can't be confirmed or ruled out.
    """
    def check(data: dict) -> bool:
        paths = find_paths(data["edges"], entry, target, max_hops=12)

        if any(not unmodeled_on(path) for path in paths):
            return False

        if paths:
            controls = {control.assumption() for path in paths for control in unmodeled_on(path)}
            raise Unmodeled("; ".join(sorted(controls)))

        return True

    return Postcondition(id=post_id, text=f"no path from {entry} to {target}",
                         needs=PATH_FILES, scopes=scopes, check=check)
# endregion no_path


# region diff_paths
def path_signature(path: list[Edge]) -> tuple[tuple[str, str, str], ...]:
    return tuple(edge_key(edge) for edge in path)


def diff_paths(
    before: list[list[Edge]], after: list[list[Edge]], incomplete: set[str]
) -> dict[str, list]:
    """Classify paths between two snapshots.

    A missing path counts as closed only if its evidence was complete.
    """
    after_by_signature = {path_signature(path): path for path in after}
    before_signatures = {path_signature(path) for path in before}
    result: dict[str, list] = {"closed": [], "unresolved": [], "persisted": [], "new": []}

    for path in before:
        later = after_by_signature.get(path_signature(path))

        if later is not None:
            # Same hops, possibly for a different reason. Report what changed in the citations.
            changed = [
                (old.detail, new.detail)
                for old, new in zip(path, later)
                if old.detail != new.detail
            ]
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
    """Partial or missing files.

    Adds every per-subscription file if any subscription was unreadable.
    """
    doubtful = incomplete_files(manifest, expected_files)

    if unreadable_scopes(manifest):
        doubtful |= SUBSCRIPTION_FILES

    return doubtful
# endregion diff_paths


# region exposure_windows
from datetime import timedelta


def open_intervals(observations: list[tuple[str, str]]) -> list[dict]:
    """Open intervals for one path.

    observations: (snapshot collectedAtUtc, 'open' | 'closed' | 'unknown'), in any order.
    """
    intervals: list[dict] = []
    current: dict | None = None
    last_closed: str | None = None

    for at, state in sorted(observations, key=lambda item: parse_utc(item[0])):
        if state == "open":
            if current is None:
                current = {
                    "lastSeenClosedBefore": last_closed,
                    "firstSeenOpen": at,
                    "lastSeenOpen": at,
                    "firstSeenClosed": None,
                }

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
    """(at least, at most) for how long a path was open.

    At least: first to last time seen open.
    At most: last seen closed before, to first seen closed after (or now).
    """
    lower = parse_utc(interval["lastSeenOpen"]) - parse_utc(interval["firstSeenOpen"])

    if interval["lastSeenClosedBefore"] is None:
        return lower, None

    end = interval["firstSeenClosed"] or now

    return lower, parse_utc(end) - parse_utc(interval["lastSeenClosedBefore"])
# endregion exposure_windows
