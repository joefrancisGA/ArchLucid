"""Import reviewed MSRC findings and link legacy provenance through scoped ingest."""

import argparse
import base64
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from scripts.securenow import msrc_advisory_preview as msrc

ALIAS = "securenow.advisory-alias.v1"
EVIDENCE = "securenow.advisory-remediation.v1"
CANONICAL_SOURCE = "ArchLucid.SecureNow.Advisory"
SCOPE_FIELDS = ("tenantId", "workspaceId", "projectId")
HEX_SHA256 = re.compile(r"[a-fA-F0-9]{64}", re.ASCII)
TARGET = re.compile(r"[A-Za-z0-9._/-]{1,128}", re.ASCII)
MAX_ITEMS = 100


def required_text(value, label, limit=256):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError(f"Invalid {label}.")
    return value.strip()


def guid(value):
    parsed = uuid.UUID(required_text(value, "scope, deployment, or finding ID", 36))
    if not parsed.int:
        raise ValueError("Empty UUID is not valid.")
    return str(parsed)


def normalized_cve(value):
    cve = required_text(value, "CVE").upper()
    if not msrc.CVE.fullmatch(cve):
        raise ValueError("Invalid CVE.")
    return cve


def normalized_target(value):
    key = required_text(value, "canonical target key", 128)
    if not TARGET.fullmatch(key):
        raise ValueError("Invalid canonical target key.")
    return key.upper()


def encode_metadata(value):
    encoded = json.dumps(value, ensure_ascii=True, separators=(",", ":"))
    if len(encoded) > 1024:
        raise ValueError("Advisory metadata exceeds the ingest limit.")
    return encoded


def build_import(entry, fetch=msrc.fetch_document):
    url = required_text(entry["url"], "MSRC source URL", 1024)
    cve = normalized_cve(entry["cve"])
    key = normalized_target(entry["targetKey"])
    product = required_text(entry["productId"], "CSAF product ID")
    expected = required_text(entry["sha256"], "reviewed document SHA-256", 64)
    if not HEX_SHA256.fullmatch(expected):
        raise ValueError("Invalid reviewed document SHA-256.")

    reviewed = entry["remediation"]
    owner = reviewed["owner"]
    fix = reviewed["providerFix"]
    action = reviewed["customerAction"]
    resource = guid(entry["cloudResourceId"]) if entry.get("cloudResourceId") is not None else None
    if (owner not in ("Provider", "Customer", "Shared", "Undetermined")
            or fix not in ("Unknown", "Pending", "Fixed", "NotApplicable")
            or action not in ("Unknown", "NotRequired", "Required")):
        raise ValueError("Invalid reviewed remediation values.")
    if (owner in ("Customer", "Shared") and (action != "Required" or resource is None)
            or owner == "Provider" and action == "Required"
            or owner == "Undetermined" and action != "Unknown"):
        raise ValueError("Reviewed responsibility and deployment mapping are inconsistent.")
    if set(reviewed) != {"owner", "providerFix", "customerAction"}:
        raise ValueError("Unexpected remediation field.")

    # Validate the URL even when the downloader is replaced by a test double.
    msrc.source_kind(url)
    evidence = msrc.preview(fetch(url), url, cve, product)
    if evidence["source_sha256"] != expected.lower():
        raise ValueError("MSRC document bytes changed. Review the new revision before importing.")
    return {
        "provider": "Azure",
        "sourceSystem": "MSRC",
        "sourceFindingId": f"{cve}:{product}",
        "cloudResourceId": resource,
        "title": f"{cve} ({product})",
        "observedUtc": evidence["publisher_release_utc"].replace("+00:00", "Z"),
        "status": "Open",
        "rawEvidenceReference": f"sha256:{expected.lower()}",
        "metadata": {
            ALIAS: encode_metadata({
                "cveId": cve, "targetKey": key, "revision": evidence["publisher_revision"],
                "referenceOnly": False,
            }),
            EVIDENCE: encode_metadata({
                "advisoryId": evidence["publisher_advisory_id"], "sourceUrl": url,
                **reviewed,
            }),
        },
    }


def prepare_legacy(entry):
    # An explicit reviewed mapping is required because legacy records need not identify a component.
    encoded_hash = required_text(entry["payloadHashSha256"], "reviewed legacy payload hash", 44)
    if len(base64.b64decode(encoded_hash, validate=True)) != 32:
        raise ValueError("Expected a 32-byte legacy payload hash in base64.")
    return {
        "legacyFindingId": guid(entry["legacyFindingId"]),
        "payloadHashSha256": encoded_hash,
        "cve": normalized_cve(entry["cve"]),
        "targetKey": normalized_target(entry["targetKey"]),
        "cloudResourceId": guid(entry["cloudResourceId"]) if entry.get("cloudResourceId") is not None else None,
    }


def build_legacy_reference(mapping, detail, scope):
    finding = detail["finding"]
    if any(guid(finding[key]) != scope[key] for key in SCOPE_FIELDS):
        raise ValueError("Legacy finding does not belong to the requested project scope.")
    resource = guid(finding["cloudResourceId"]) if finding.get("cloudResourceId") is not None else None
    if (guid(finding["findingId"]) != mapping["legacyFindingId"]
            or finding.get("payloadHashSha256") != mapping["payloadHashSha256"]
            or resource != mapping["cloudResourceId"]
            or str(finding.get("provider")).lower() not in ("1", "azure")
            or finding["sourceSystem"].strip().casefold() == CANONICAL_SOURCE.casefold()):
        raise ValueError("Legacy finding changed or does not match its reviewed mapping.")

    matching = [row["metadataValue"] for row in detail["metadata"]
                if row["metadataKey"] == EVIDENCE]
    if len(matching) != 1:
        raise ValueError("Legacy finding lacks unique typed advisory evidence.")
    evidence = json.loads(matching[0])
    stored_cve = required_text(evidence["advisoryId"], "legacy advisory ID").upper().removeprefix("MSRC_")
    if stored_cve != mapping["cve"]:
        raise ValueError("Legacy evidence does not match the reviewed CVE.")
    source = urllib.parse.urlsplit(required_text(evidence["sourceUrl"], "legacy source URL", 1024))
    if source.scheme != "https" or not source.hostname or source.username is not None:
        raise ValueError("Legacy source evidence must use HTTPS without credentials.")
    return {
        "provider": "Azure",
        "sourceSystem": required_text(finding["sourceSystem"], "legacy source system"),
        "sourceFindingId": required_text(finding["sourceFindingId"], "legacy source finding ID", 512),
        "cloudResourceId": resource,
        "title": f"Legacy source for {mapping['cve']}",
        "observedUtc": "2000-01-01T00:00:00Z",  # Reference-only entries cannot advance canonical chronology.
        "status": "Open",
        "rawEvidenceReference": "legacy-finding:" + mapping["legacyFindingId"],
        "metadata": {
            ALIAS: encode_metadata({
                "cveId": mapping["cve"], "targetKey": mapping["targetKey"],
                "revision": "legacy:" + mapping["payloadHashSha256"], "referenceOnly": True,
            }),
            # A reference may not turn historical claims into canonical remediation decisions.
            EVIDENCE: encode_metadata({
                "advisoryId": evidence["advisoryId"], "sourceUrl": evidence["sourceUrl"],
                "owner": "Undetermined", "providerFix": "Unknown", "customerAction": "Unknown",
            }),
        },
    }


class ScopedClient:
    def __init__(self, origin, token, scope, opener=None):
        uri = urllib.parse.urlsplit(origin)
        if (uri.scheme != "https" or not uri.hostname or uri.username is not None
                or uri.path not in ("", "/") or uri.query or uri.fragment
                or not token or any(ch.isspace() for ch in token)):
            raise ValueError("Apply requires an HTTPS API origin and an API token.")
        self.origin = origin.rstrip("/")
        self.headers = {"Authorization": "Bearer " + token, "Accept": "application/json",
                        "Content-Type": "application/json"}
        self.headers.update({header: scope[key] for header, key in zip(
            ("X-Tenant-Id", "X-Workspace-Id", "X-Project-Id"), SCOPE_FIELDS)})
        self.opener = opener or urllib.request.build_opener(msrc._NoRedirect())

    def request(self, suffix, body=None):
        url = self.origin + "/v1/operational-security/findings/" + suffix
        req = urllib.request.Request(url, headers=self.headers,
            data=None if body is None else json.dumps(body).encode())
        with self.opener.open(req, timeout=30) as response:
            if response.geturl() != url:
                raise ValueError("Unexpected API response URL.")
            raw = response.read(msrc.MAX_BYTES + 1)
        if len(raw) > msrc.MAX_BYTES:
            raise ValueError("API response exceeds the read limit.")
        return json.loads(raw)

    def ingest(self, items):
        if not items:
            return {}
        result = self.request("ingest", {"items": items})
        # Server commits per item, so expose failed counts rather than claiming bulk atomicity.
        counts = {key: result.get(key) for key in ("ingestedCount", "deduplicatedCount", "failedCount")}
        if (any(type(value) is not int or value < 0 for value in counts.values())
                or sum(counts.values()) != len(items)):
            raise ValueError("Invalid ingest response; verify results before retrying.")
        return counts


def run(manifest, apply=False, api_origin=None, token=None, fetch=msrc.fetch_document, make_client=ScopedClient):
    scope = {key: guid(manifest["scope"][key]) for key in SCOPE_FIELDS}
    imports = manifest.get("advisories", [])
    mapping = manifest.get("legacyAliases", [])
    if (not isinstance(imports, list) or not isinstance(mapping, list)
            or not 1 <= len(imports) + len(mapping) <= MAX_ITEMS):
        raise ValueError("Batch must contain 1 to 100 import or legacy mapping entries.")

    items = [build_import(entry, fetch) for entry in imports]
    legacy = [prepare_legacy(entry) for entry in mapping]
    target_keys = [(normalized_cve(entry["cve"]), normalized_target(entry["targetKey"]),
                    item["cloudResourceId"]) for entry, item in zip(imports, items)]
    if len(set(target_keys)) != len(target_keys):
        raise ValueError("Review only one publisher revision per canonical target in a batch.")
    if len({entry["legacyFindingId"] for entry in legacy}) != len(legacy):
        raise ValueError("A legacy finding must have exactly one mapping per batch.")
    if not apply:
        return {"applied": False, "scope": scope, "advisoryItems": items, "legacyMappings": legacy}
    client = make_client(api_origin, token, scope)
    references = [build_legacy_reference(entry, client.request(entry["legacyFindingId"]), scope)
                  for entry in legacy]
    authoritative = client.ingest(items)
    linked = {} if authoritative.get("failedCount") else client.ingest(references)
    return {"applied": True, "scope": scope, "authoritative": authoritative, "legacyReferences": linked}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--api-origin")
    args = parser.parse_args(argv)
    try:
        with args.manifest.open("rb") as handle:
            raw = handle.read(msrc.MAX_BYTES + 1)
        if len(raw) > msrc.MAX_BYTES:
            raise ValueError("Manifest exceeds the read limit.")
        manifest = json.loads(raw, object_pairs_hook=msrc._unique_keys)
        result = run(manifest, args.apply, args.api_origin, os.getenv("ARCHLUCID_API_TOKEN"))
        print(json.dumps(result, sort_keys=True, indent=2))
        return 1 if result.get("authoritative", {}).get("failedCount") or result.get("legacyReferences", {}).get("failedCount") else 0
    except (OSError, TypeError, ValueError, KeyError, AttributeError, RecursionError) as exc:
        print(f"MSRC batch failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
