r"""
check_migration_numbering.py
-----------------------------
Validates the DbUp migration filename invariants for ArchLucid.Persistence/Migrations/.

Rules enforced (each violation is fatal, exit code 1):

  R1  Every file matches the pattern  ^\d{3}_[A-Za-z0-9_]+\.sql$
  R2  No new/modified duplicate numeric prefix; unchanged historical Git blobs are reported.
  R3  No gap larger than MAX_GAP between consecutive prefixes
      (gaps are allowed — DbUp orders lexically — but a giant gap usually
       means a renumbered or missing file and is worth a human glance).

Why this script exists:
  DbUp orders migrations by **embedded resource name** (lexical). Two files
  numbered 096_Foo.sql and 096_Bar.sql will both run, but the order between
  them is implementation-defined and changes silently when a file is renamed.
  This script makes that hazard merge-blocking.

Run:  python scripts/ci/check_migration_numbering.py
Exit: 0 = clean. 1 = at least one violation.

Companion to:
  - scripts/ci/check_pricing_single_source.py
  - scripts/ci/check_doc_links.py
"""

from __future__ import annotations

import hashlib
import os
import re
import sys
from collections import defaultdict


REPO_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, "ArchLucid.Persistence", "Migrations")

FILENAME_PATTERN = re.compile(r"^(\d{3})_[A-Za-z0-9_]+\.sql$")
MAX_GAP = 3  # Tolerate small gaps from removed/renumbered files; flag big ones.

# Historical duplicate prefixes found at RC43 e871820001ce5067b30068a52eb03cce399b2cf5.
# These migration *blobs* are immutable compatibility exceptions, not proof of
# successful deployment or license to introduce further duplicate numbers.
# The check still rejects new/modified members and every unlisted collision.
# Keep the original DbUp embedded-resource names / journal identities intact.
HISTORICAL_DUPLICATE_BLOBS: dict[str, dict[str, str]] = {
    "337": {
        "337_Runs_CreatedByUserId.sql": "c10f7a4f3df0aa5e11b73af668c14dc211568599",
        "337_WizardIntakeDrafts.sql": "3e33c9dce00de7dbe766fe68d36d38e1da63d316"
    },
    "344": {
        "344_GovernanceWorkflow_Environments_Widen.sql": "c5514ed2915d439c8351b08a8490324e7e80dd35",
        "344_RunArchitectureVersionContentHashPin.sql": "884e41986313556496dc21d2aa50aed6891bb962"
    },
    "354": {
        "354_AuditControlTechnicalTimeline.sql": "ec16316545ee69f516bb8eea4288ea0532523c5f",
        "354_GoldenManifests_HasherBoundJson.sql": "dbef7997ce6409924a93c9b41b2ae8c876478ded"
    },
    "355": {
        "355_PolicyPacks_PackSlug.sql": "d6c7314f8c164a8748bcd82969ae29426fb9051e",
        "355_SecurityCrosswalkMappings.sql": "17bc872b796c818635bd0dc08d2ffe9269232dab"
    },
    "356": {
        "356_OperationalSecurityFindings.sql": "7a3786e8e6e1feb7c81cb02ef7d5ffb56c842b02",
        "356_Runs_AcknowledgedCoverageJson.sql": "89735e94daafff9a64460de9f97ed1708c35fbd7"
    },
    "357": {
        "357_PolicyPacks_PackSlug_Backfill.sql": "bcd7b0ba174ecd5463d352d21c887664f6f53f58",
        "357_RemediationPatterns.sql": "22417b09c59b111b499a4ba1f5a502ec76e6d096"
    },
    "359": {
        "359_OperationalSecurityExceptions.sql": "c5b260c6b1cea7208654e9604113358be3c3d29a",
        "359_Runs_AcknowledgedCoverageJson_Repair.sql": "dd6b7530977bd962d1053d959347ba4e10a37586"
    },
    "370": {
        "370_FindingCurrentDispositions.sql": "33149f1b30256764b6b31675850b2418344a2311",
        "370_FindingInsightSignals.sql": "d0be3ef202d6f4bfff5878a10ec166c5c7a94b86"
    },
    "381": {
        "381_GrandfatherArchitecturesRestrictToShares.sql": "8436249fee1f9c9a14e5c71fc3af81c1902a1034",
        "381_SecurityEvidencePaths.sql": "4fa9074701e49ee887710dc89bfbecb9d0ef0377"
    },
    "390": {
        "390_Runs_AcknowledgedAssumptionsJson.sql": "b68d926500d07c6c8b3d33168593a09b0bbf1878",
        "390_Runs_ExecutePostureStamp.sql": "8fbfaf0bb603e9819f0b91a0df5f1487df024d5e"
    },
    "400": {
        "400_FirstTenantFunnelEvents_LiveSeatScope.sql": "a4d01106a4d9ff7c74223a4719af23e130e2d6d4",
        "400_OperationalSecurityFindingsScopedNaturalKey.sql": "e509fd6b27c0da3df75518dcb972ab9486a34d77"
    },
    "405": {
        "405_AzureInventoryAdfExternalSources.sql": "f4ae207720920f37a61ecbede7522e21fbb7c1d4",
        "405_SecureNowQuestionDispositions.sql": "253a115ff68488a6fd85656614c91c8c5e571e5d"
    },
    "409": {
        "409_RoleAssignmentPimEligibilityKind.sql": "6470e1dad9ceaf905d56694ecc98487bc84f6f4f",
        "409_SecureNowCollectionRuns.sql": "bbb4b1a460e9b5aeb8df8cdf7d37e27fdf78bc6a"
    },
    "410": {
        "410_InfrastructureDiagramDocumentationDecisions.sql": "1bcd5c31b40b0cabb6f911e580b23a5bb17850b1",
        "410_SecureNowCollectionRunSchedule.sql": "c027c7b5dc1118a875734c235153d11ba5ebd4d5"
    }
}


def git_blob_sha(path: str) -> str:
    """Compute Git's blob identity, catching edits to grandfathered migrations."""
    with open(path, "rb") as migration_file:
        contents = migration_file.read()
    prefix = f"blob {len(contents)}".encode("ascii") + bytes([0])
    return hashlib.sha1(prefix + contents).hexdigest()



def main() -> int:
    if not os.path.isdir(MIGRATIONS_DIR):
        print(f"[FAIL] Migrations directory not found: {MIGRATIONS_DIR}", file=sys.stderr)
        return 1

    filenames = sorted(
        f for f in os.listdir(MIGRATIONS_DIR)
        if os.path.isfile(os.path.join(MIGRATIONS_DIR, f)) and f.endswith(".sql")
    )

    if not filenames:
        print(f"[FAIL] No .sql files in {MIGRATIONS_DIR}", file=sys.stderr)
        return 1

    violations: list[str] = []

    # R1: pattern check
    bad_pattern = [f for f in filenames if not FILENAME_PATTERN.match(f)]
    for f in bad_pattern:
        violations.append(f"R1 (pattern): '{f}' does not match '###_Description.sql'")

    # R2: duplicate-prefix check
    by_prefix: dict[str, list[str]] = defaultdict(list)
    for f in filenames:
        m = FILENAME_PATTERN.match(f)
        if m:
            by_prefix[m.group(1)].append(f)
    for prefix, group in by_prefix.items():
        if len(group) > 1:
            observed_blobs = {
                name: git_blob_sha(os.path.join(MIGRATIONS_DIR, name))
                for name in group
            }
            if observed_blobs == HISTORICAL_DUPLICATE_BLOBS.get(prefix):
                print(
                    f"[HISTORICAL R2] prefix '{prefix}': original immutable blobs "
                    "preserved; DbUp deployment/journal compatibility remains unverified."
                )
                continue
            violations.append(
                f"R2 (duplicate prefix '{prefix}'): {sorted(group)}. "
                "New or modified collision is forbidden; preserve applied DbUp resource names."
            )

    # R3: oversized-gap check (informational unless flagged as violation by length)
    sorted_prefixes = sorted(int(p) for p in by_prefix.keys())
    big_gaps: list[tuple[int, int]] = []
    for prev, curr in zip(sorted_prefixes, sorted_prefixes[1:]):
        gap = curr - prev
        if gap > MAX_GAP:
            big_gaps.append((prev, curr))
    for prev, curr in big_gaps:
        violations.append(
            f"R3 (large gap): {prev:03d} -> {curr:03d} (gap of {curr - prev}). "
            "If this is intentional (renumbered or removed migrations), document in docs/SQL_SCRIPTS.md."
        )

    if violations:
        print(f"[FAIL] {len(violations)} migration-numbering violation(s):", file=sys.stderr)
        for v in violations:
            print(f"  - {v}", file=sys.stderr)
        print("", file=sys.stderr)
        print("Hint: see docs/SQL_DDL_DISCIPLINE.md for the migration-naming convention.", file=sys.stderr)
        return 1

    print(
        f"[OK] {len(filenames)} migration files; "
        f"{len(by_prefix)} unique prefixes; no duplicates; max gap <= {MAX_GAP}."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
