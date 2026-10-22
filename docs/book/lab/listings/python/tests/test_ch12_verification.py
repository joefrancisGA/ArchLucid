"""Chapter 12: verdicts, the opening story's two snapshot diffs, and exposure windows."""

from __future__ import annotations

import unittest
from datetime import timedelta

import lab_graph as lab
from ch05_paths import Edge, find_paths
from ch12_verification import (
    FAILED,
    NOT_VERIFIED,
    PATH_FILES,
    SUBSCRIPTION_FILES,
    VERIFIED,
    diff_paths,
    files_in_doubt,
    no_path,
    open_duration_bounds,
    open_intervals,
    shared_key_off,
    the_row,
    verify,
)

CHANGE_AT = "2026-10-12T09:00:00Z"
SCOPE = "subscription sub-payments-prod"
HELPDESK_AFTER = ("directory-role-assignments.json row 57 "
                  "(Application Administrator, scope /, via group helpdesk-tier2)")


def manifest(collected: str = "2026-10-12T14:00:00Z", files: frozenset[str] = PATH_FILES,
             gaps: list[dict] | None = None, read_at: dict[str, str] | None = None) -> dict:
    """Every file is read at `collected` unless read_at gives it another time."""
    when = read_at or {}
    entries = [{"name": name, "queriedAtUtc": when.get(name, collected),
                "completedAtUtc": when.get(name, collected)} for name in sorted(files)]

    return {"collectedAtUtc": collected, "files": entries, "gaps": gaps or []}


def storage(*rows: dict) -> dict:
    return {"storage-accounts.json": list(rows)}


def lab_paths(edges: list[Edge]) -> list[list[Edge]]:
    return [path for paths in lab.labeled_paths(edges).values() for path in paths]


def on_demand_edges() -> list[Edge]:
    """The second Monday: owner removed, help desk moved to another role, shared key disabled."""
    return lab.lab_edges(dev_lead_owner=False, helpdesk_citation=HELPDESK_AFTER, custdata_shared_key="disabled")


def labels(paths: list[list[Edge]]) -> list[str]:
    by_endpoints = {endpoints: label for label, endpoints in lab.BOOK_PATHS.items()}

    return sorted(by_endpoints[(path[0].source, path[-1].target)] for path in paths)


class Verdicts(unittest.TestCase):
    def check(self, snapshot: dict, data: dict) -> tuple[str, str]:
        return verify(shared_key_off, snapshot, data, CHANGE_AT, set(PATH_FILES))

    def test_verified(self) -> None:
        verdict = self.check(manifest(), storage({"name": "custdata", "sharedKey": "disabled"}))

        self.assertEqual(verdict, (VERIFIED, "custdata has shared key access disabled"))

    def test_failed(self) -> None:
        verdict = self.check(manifest(), storage({"name": "custdata", "sharedKey": "enabled"}))

        self.assertEqual(verdict[0], FAILED)

    def test_snapshot_older_than_change(self) -> None:
        verdict = self.check(manifest(collected="2026-10-12T08:59:59Z"), storage())

        self.assertEqual(verdict, (NOT_VERIFIED, "read before the change was applied: storage-accounts.json"))

    def test_input_read_at_the_change_time_is_too_early(self) -> None:
        verdict = self.check(manifest(read_at={"storage-accounts.json": CHANGE_AT}), storage())

        self.assertEqual(verdict[0], NOT_VERIFIED)

    def test_stale_file_the_check_does_not_read_is_ignored(self) -> None:
        early = manifest(read_at={"role-assignments.json": "2026-10-12T08:00:00Z"})

        self.assertEqual(self.check(early, storage({"name": "custdata", "sharedKey": "disabled"}))[0],
                         VERIFIED)

    def test_missing_file(self) -> None:
        verdict = self.check(manifest(files=PATH_FILES - {"storage-accounts.json"}), storage())

        self.assertEqual(verdict, (NOT_VERIFIED, "incomplete evidence: storage-accounts.json"))

    def test_partial_file(self) -> None:
        gap = {"kind": "partial", "file": "storage-accounts.json"}

        self.assertEqual(self.check(manifest(gaps=[gap]), storage())[0], NOT_VERIFIED)

    def test_unreadable_scope(self) -> None:
        gap = {"kind": "scopeNotReadable", "target": SCOPE}

        self.assertEqual(self.check(manifest(gaps=[gap]), storage()),
                         (NOT_VERIFIED, f"scope not readable: {SCOPE}"))

    def test_absent_subject(self) -> None:
        verdict = self.check(manifest(), storage({"name": "custarchive", "sharedKey": "enabled"}))

        self.assertEqual(verdict[0], NOT_VERIFIED)
        self.assertIn("0 rows match", verdict[1])

    def test_duplicate_subject(self) -> None:
        row = {"name": "custdata", "sharedKey": "disabled"}

        self.assertIn("2 rows match", self.check(manifest(), storage(row, row))[1])

    def test_the_row_matches_every_field(self) -> None:
        rows = [{"name": "a", "kind": "x"}, {"name": "a", "kind": "y"}]

        self.assertEqual(the_row(rows, name="a", kind="y"), rows[1])


class PathPostconditions(unittest.TestCase):
    def test_removed_owner_passes_its_path_check(self) -> None:
        post = no_path("rec-1/v1", lab.DEV_LEAD, lab.READ_CUSTDATA, frozenset({SCOPE}))
        verdict = verify(post, manifest(), {"edges": on_demand_edges()}, CHANGE_AT, set(PATH_FILES))

        self.assertEqual(verdict, (VERIFIED, f"no path from {lab.DEV_LEAD} to {lab.READ_CUSTDATA}"))

    def test_failed_help_desk_fix_fails_its_path_check(self) -> None:
        post = no_path("rec-2/v1", lab.HELPDESK, lab.READ_CUSTARCHIVE, frozenset({SCOPE}))
        verdict = verify(post, manifest(), {"edges": on_demand_edges()}, CHANGE_AT, set(PATH_FILES))

        self.assertEqual(verdict[0], FAILED)

    def test_inputs_straddling_the_change_are_not_verified(self) -> None:
        # A targeted re-collection after the change, merged with one file read before it.
        post = no_path("rec-1/v1", lab.DEV_LEAD, lab.READ_CUSTDATA, frozenset({SCOPE}))
        straddling = manifest(read_at={"application-owners.json": "2026-10-12T08:55:00Z"})
        verdict = verify(post, straddling, {"edges": on_demand_edges()}, CHANGE_AT, set(PATH_FILES))

        self.assertEqual(verdict, (NOT_VERIFIED, "read before the change was applied: application-owners.json"))

    def conditioned_reader(self) -> dict:
        return {"principal": lab.ANALYST, "role_name": "Storage Blob Data Reader", "scope": lab.CUSTDATA,
                "condition": "@Resource[containers:name] StringEquals 'reports'",
                "citation": "role-assignments.json row 31"}

    def analyst_check(self, edges: list[Edge]) -> tuple[str, str]:
        post = no_path("rec-4/v1", lab.ANALYST, lab.READ_CUSTDATA, frozenset({SCOPE}))

        return verify(post, manifest(), {"edges": edges}, CHANGE_AT, set(PATH_FILES))

    def test_path_through_an_unmodeled_control_is_not_verified(self) -> None:
        verdict = self.analyst_check(lab.lab_edges(extra_assignments=[self.conditioned_reader()]))

        self.assertEqual(verdict[0], NOT_VERIFIED)
        self.assertTrue(verdict[1].startswith("depends on an unmodeled control: roleCondition"))

    def test_plain_path_beside_an_unmodeled_one_still_fails(self) -> None:
        plain = dict(self.conditioned_reader(), condition="", scope=lab.RG_PROD, citation="row 32")
        edges = lab.lab_edges(extra_assignments=[self.conditioned_reader(), plain])

        self.assertEqual(self.analyst_check(edges)[0], FAILED)


class OpeningStoryDiffs(unittest.TestCase):
    def test_first_monday_everything_unresolved(self) -> None:
        unreadable = manifest(gaps=[{"kind": "scopeNotReadable", "target": SCOPE}])
        doubt = files_in_doubt(unreadable, set(PATH_FILES))
        # Nothing in the unreadable subscription was collected, so no capability edges were derived.
        result = diff_paths(lab_paths(lab.lab_edges()), lab_paths(lab.observed_edges()), doubt)

        self.assertTrue(SUBSCRIPTION_FILES <= doubt)
        self.assertEqual(labels(result["unresolved"]), ["P1", "P2", "P3", "P4", "P5", "P6"])
        self.assertEqual(result["closed"], [])

    def test_second_monday(self) -> None:
        result = diff_paths(lab_paths(lab.lab_edges()), lab_paths(on_demand_edges()), set())
        persisted = {labels([path])[0]: changed for path, changed in result["persisted"]}

        self.assertEqual(labels(result["closed"]), ["P1", "P2", "P3", "P5"])
        self.assertEqual(sorted(persisted), ["P4", "P6"])
        self.assertEqual(persisted["P4"], [])
        self.assertEqual(persisted["P6"], [(
            "directory-role-assignments.json row 41 (Cloud Application Administrator, scope /)",
            HELPDESK_AFTER,
        )])
        self.assertEqual(result["new"], [])

    def test_doubt_follows_the_files_behind_each_hop(self) -> None:
        # canAddCredential can come from ownership or a directory role, so both entry routes are in doubt.
        result = diff_paths(lab_paths(lab.lab_edges()), [], {"application-owners.json"})

        self.assertEqual(labels(result["unresolved"]), ["P2", "P3", "P5", "P6"])
        self.assertEqual(labels(result["closed"]), ["P1", "P4"])

    def test_new_path(self) -> None:
        reader = {"principal": lab.ANALYST, "role_name": "Storage Blob Data Reader", "scope": lab.CUSTDATA,
                  "citation": "role-assignments.json row 31"}
        after_edges = lab.lab_edges(extra_assignments=[reader])
        analyst_paths = find_paths(after_edges, lab.ANALYST, lab.READ_CUSTDATA)
        result = diff_paths(lab_paths(lab.lab_edges()), lab_paths(after_edges) + analyst_paths, set())

        self.assertEqual(len(analyst_paths), 1)
        self.assertEqual(result["new"], analyst_paths)
        self.assertEqual(len(result["persisted"]), 6)

    def test_unknown_kind_raises(self) -> None:
        path = [Edge("user:x", "app:y", "ownerOf", "observed", "row")]

        with self.assertRaises(KeyError):
            diff_paths([path], [], set())

    def test_files_in_doubt_without_unreadable_scope(self) -> None:
        partial = manifest(gaps=[{"kind": "partial", "file": "role-assignments.json"}])

        self.assertEqual(files_in_doubt(partial, set(PATH_FILES)), {"role-assignments.json"})


class ExposureWindows(unittest.TestCase):
    def test_gap_neither_opens_nor_closes(self) -> None:
        intervals = open_intervals([
            ("2026-09-15T00:00:00Z", "open"),
            ("2026-09-01T00:00:00Z", "open"),
            ("2026-09-08T00:00:00Z", "unknown"),
            ("2026-09-22T00:00:00Z", "closed"),
        ])

        self.assertEqual(intervals, [{
            "lastSeenClosedBefore": None,
            "firstSeenOpen": "2026-09-01T00:00:00Z",
            "lastSeenOpen": "2026-09-15T00:00:00Z",
            "firstSeenClosed": "2026-09-22T00:00:00Z",
        }])
        self.assertEqual(open_duration_bounds(intervals[0], "2026-10-01T00:00:00Z"), (timedelta(days=14), None))

    def test_bounded_interval_still_open(self) -> None:
        intervals = open_intervals([("2026-08-25T00:00:00Z", "closed"), ("2026-09-01T00:00:00Z", "open")])
        bounds = open_duration_bounds(intervals[0], "2026-09-24T00:00:00Z")

        self.assertEqual(bounds, (timedelta(0), timedelta(days=30)))

    def test_bounded_and_closed(self) -> None:
        intervals = open_intervals([
            ("2026-08-25T00:00:00Z", "closed"),
            ("2026-09-01T00:00:00Z", "open"),
            ("2026-09-24T00:00:00Z", "open"),
            ("2026-09-30T00:00:00Z", "closed"),
        ])

        self.assertEqual(open_duration_bounds(intervals[0], "2026-10-11T00:00:00Z"),
                         (timedelta(days=23), timedelta(days=36)))

    def test_reopened_path_has_two_intervals(self) -> None:
        intervals = open_intervals([
            ("2026-09-01T00:00:00Z", "open"),
            ("2026-09-08T00:00:00Z", "closed"),
            ("2026-09-15T00:00:00Z", "open"),
        ])

        self.assertEqual(len(intervals), 2)
        self.assertEqual(intervals[1]["lastSeenClosedBefore"], "2026-09-08T00:00:00Z")
        self.assertIsNone(intervals[1]["firstSeenClosed"])

    def test_closed_only(self) -> None:
        self.assertEqual(open_intervals([("2026-09-01T00:00:00Z", "closed")]), [])


if __name__ == "__main__":
    unittest.main()
