"""The companion lab's payments estate (Appendix A) as Chapter 5 graph input.

Observed edges are written by hand, the way a loader would emit them from the snapshot files.
Capability edges come from derive_capability_edges, so the tests exercise the derivation too.
"""

from __future__ import annotations

import support  # noqa: F401  (puts the listings folder on sys.path)
from ch05_paths import Edge, derive_capability_edges, find_paths

SUBSCRIPTION = "/subscriptions/sub-payments-prod"
RG_PROD = f"{SUBSCRIPTION}/resourceGroups/rg-payments-prod"
RG_ARCHIVE = f"{SUBSCRIPTION}/resourceGroups/rg-payments-archive"
PAY_RECONCILE = f"{RG_PROD}/providers/Microsoft.Web/sites/pay-reconcile"
CUSTDATA = f"{RG_PROD}/providers/Microsoft.Storage/storageAccounts/custdata"
CUSTARCHIVE = f"{RG_ARCHIVE}/providers/Microsoft.Storage/storageAccounts/custarchive"

WORKFLOW = "entry:github-main"
DEV_LEAD = "user:dev-lead"
HELPDESK = "user:helpdesk-07"
ANALYST = "user:analyst-04"
APP = "app:payments-deploy"
SP = "sp:payments-deploy"
MI_RECONCILE = "mi:mi-pay-reconcile"
MI_API = "mi:mi-payments-api"
READ_CUSTDATA = "read:custdata"
READ_CUSTARCHIVE = "read:custarchive"

ENTRIES = [WORKFLOW, DEV_LEAD, HELPDESK, ANALYST]
TARGETS = [READ_CUSTDATA, READ_CUSTARCHIVE]
# The book's path labels (Appendix A.3, Chapter 9's pack).
BOOK_PATHS = {
    "P1": (WORKFLOW, READ_CUSTDATA),
    "P2": (DEV_LEAD, READ_CUSTDATA),
    "P3": (HELPDESK, READ_CUSTDATA),
    "P4": (WORKFLOW, READ_CUSTARCHIVE),
    "P5": (DEV_LEAD, READ_CUSTARCHIVE),
    "P6": (HELPDESK, READ_CUSTARCHIVE),
}

BLOB_ACTIONS = "Microsoft.Storage/storageAccounts/blobServices/containers/blobs"
ROLE_DEFINITIONS = {
    "Contributor": {"permissions": [{
        "actions": ["*"],
        "not_actions": [
            "Microsoft.Authorization/*/Delete",
            "Microsoft.Authorization/*/Write",
            "Microsoft.Authorization/elevateAccess/Action",
        ],
    }]},
    "Reader": {"permissions": [{"actions": ["*/read"]}]},
    "Storage Blob Data Reader": {"permissions": [{
        "actions": ["Microsoft.Storage/storageAccounts/blobServices/containers/read"],
        "data_actions": [f"{BLOB_ACTIONS}/read"],
    }]},
    "Storage Blob Data Contributor": {"permissions": [{
        "actions": ["Microsoft.Storage/storageAccounts/blobServices/containers/*"],
        "data_actions": [f"{BLOB_ACTIONS}/read", f"{BLOB_ACTIONS}/write", f"{BLOB_ACTIONS}/delete"],
    }]},
}

CHILDREN_OF = {
    SUBSCRIPTION: [RG_PROD, RG_ARCHIVE],
    RG_PROD: [PAY_RECONCILE, CUSTDATA],
    RG_ARCHIVE: [CUSTARCHIVE],
}


def assignments() -> list[dict]:
    return [
        {"principal": SP, "role_name": "Contributor", "scope": RG_PROD,
         "citation": "role-assignments.json row 12"},
        {"principal": MI_RECONCILE, "role_name": "Storage Blob Data Reader", "scope": CUSTARCHIVE,
         "citation": "role-assignments.json row 19"},
        {"principal": ANALYST, "role_name": "Reader", "scope": RG_PROD,
         "citation": "role-assignments.json row 23"},
        {"principal": MI_API, "role_name": "Storage Blob Data Contributor", "scope": CUSTDATA,
         "citation": "role-assignments.json row 27"},
    ]


def children_of(archive_in_prod: bool = False) -> dict[str, list[str]]:
    """Containment. archive_in_prod puts custarchive back in rg-payments-prod, as the lab once did."""
    if not archive_in_prod:
        return CHILDREN_OF

    return {SUBSCRIPTION: [RG_PROD], RG_PROD: [PAY_RECONCILE, CUSTDATA, CUSTARCHIVE]}


def resources(custdata_shared_key: str = "enabled") -> list[dict]:
    return [
        {"id": PAY_RECONCILE, "scope": PAY_RECONCILE, "type": "compute"},
        {"id": CUSTDATA, "scope": CUSTDATA, "type": "storage",
         "shared_key": custdata_shared_key, "capability": READ_CUSTDATA},
        {"id": CUSTARCHIVE, "scope": CUSTARCHIVE, "type": "storage",
         "shared_key": "enabled", "capability": READ_CUSTARCHIVE},
    ]


def observed_edges(
    dev_lead_owner: bool = True,
    helpdesk_citation: str = "directory-role-assignments.json row 41 "
                             "(Cloud Application Administrator, scope /)",
) -> list[Edge]:
    edges = [
        Edge(WORKFLOW, APP, "canSignInAs", "observed", "federated-credentials.json row 3"),
        Edge(HELPDESK, APP, "canAddCredential", "derived", helpdesk_citation),
        Edge(APP, SP, "appFor", "observed", "service-principals.json row 8"),
        Edge(PAY_RECONCILE, MI_RECONCILE, "runsAs", "observed", "compute-identities.json row 2"),
        Edge(SP, RG_PROD, "hasRoleAt", "observed", "role-assignments.json row 12"),
    ]

    if dev_lead_owner:
        edges.append(Edge(DEV_LEAD, APP, "canAddCredential", "observed", "application-owners.json row 5"))

    return edges


def lab_edges(
    dev_lead_owner: bool = True,
    helpdesk_citation: str | None = None,
    custdata_shared_key: str = "enabled",
    archive_in_prod: bool = False,
    extra_assignments: list[dict] | None = None,
) -> list[Edge]:
    """The whole graph. The arguments model the Chapter 11 and 12 changes."""
    observed = (
        observed_edges(dev_lead_owner, helpdesk_citation)
        if helpdesk_citation is not None
        else observed_edges(dev_lead_owner)
    )
    derived = derive_capability_edges(
        assignments() + (extra_assignments or []),
        ROLE_DEFINITIONS,
        children_of(archive_in_prod),
        [],
        resources(custdata_shared_key),
    )

    return observed + derived


def labeled_paths(edges: list[Edge]) -> dict[str, list[list[Edge]]]:
    """Paths found for each book label; a label with no path maps to an empty list."""
    return {label: find_paths(edges, entry, target) for label, (entry, target) in BOOK_PATHS.items()}
