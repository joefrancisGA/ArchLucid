"""Fetch one MSRC CSAF or VEX document and preview exact product evidence."""

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

MAX_BYTES = 4 * 1024 * 1024
SOURCE = re.compile(
    r"https://msrc\.microsoft\.com/csaf/(advisories|vex)/[0-9]{4}/"
    r"[A-Za-z0-9_-]+\.json", re.ASCII
)
CVE = re.compile(r"CVE-[0-9]{4}-[0-9]{4,18}", re.ASCII)
PRODUCT_STATUSES = (
    "known_affected", "known_not_affected", "fixed", "under_investigation",
    "first_affected", "last_affected", "first_fixed", "recommended",
)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def source_kind(url):
    match = SOURCE.fullmatch(url)
    if not match:
        raise ValueError("Expected an exact HTTPS MSRC CSAF/VEX document URL.")
    return match.group(1)


def fetch_document(url, opener=None):
    source_kind(url)
    if opener is None:
        opener = urllib.request.build_opener(_NoRedirect())
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    with opener.open(request, timeout=15) as response:
        if response.geturl() != url:
            raise ValueError("Unexpected response URL.")
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("Document exceeds the download limit.")
    return raw


def _product_ids(tree):
    stack = [tree]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            if isinstance(item.get("product_id"), str):
                yield item["product_id"]
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)


def _unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON member in source document.")
        result[key] = value
    return result


def preview(raw, url, cve, product_id):
    kind = source_kind(url)
    cve = cve.strip().upper()
    if not CVE.fullmatch(cve) or not product_id.strip() or len(raw) > MAX_BYTES:
        raise ValueError("A valid CVE and an exact product ID are required within the input limits.")

    try:
        parsed = json.loads(raw, object_pairs_hook=_unique_keys)
        if not isinstance(parsed, dict):
            raise ValueError("Expected a CSAF object.")
        document = parsed["document"]
        publisher = document["publisher"]
        if (document["csaf_version"] != "2.0" or publisher["category"] != "vendor"
                or publisher["name"] != "Microsoft Security Response Center"
                or publisher["namespace"] not in {"https://www.microsoft.com", "https://msrc.microsoft.com"}):
            raise ValueError("Expected an MSRC CSAF 2.0 document.")
        tracking = document["tracking"]
        advisory_id = tracking["id"]
        revision = tracking["version"]
        if not all(isinstance(v, str) and v.strip() for v in (advisory_id, revision)):
            raise ValueError("Missing advisory ID or revision.")
        released = datetime.fromisoformat(tracking["current_release_date"].replace("Z", "+00:00"))
        if released.tzinfo is None or released.utcoffset() is None:
            raise ValueError("The publisher release timestamp must have a time zone.")
        matching = [v for v in parsed["vulnerabilities"] if v.get("cve") == cve]
        if len(matching) != 1 or product_id not in set(_product_ids(parsed["product_tree"])):
            raise ValueError("The CVE and exact product must be declared in the source document.")
        product_status = matching[0].get("product_status", {})
        if not isinstance(product_status, dict):
            raise ValueError("Invalid product-status structure.")
        statuses = []
        for status in PRODUCT_STATUSES:
            values = product_status.get(status, [])
            if not isinstance(values, list) or not all(isinstance(v, str) for v in values):
                raise ValueError("Invalid product-status list.")
            if product_id in values:
                statuses.append(status)
    except (AttributeError, KeyError, TypeError, RecursionError) as exc:
        raise ValueError("Invalid MSRC CSAF structure.") from exc

    return {
        "source_kind": kind,
        "source_url": url,
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "publisher_advisory_id": advisory_id,
        "publisher_revision": revision,
        "publisher_release_utc": released.astimezone(timezone.utc).isoformat(),
        "cve_id": cve,
        "csaf_product_id": product_id,
        "reported_product_statuses": statuses,
        "decision": "review_required",
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="Exact MSRC CSAF/VEX JSON document URL")
    parser.add_argument("--cve", required=True)
    parser.add_argument("--product-id", required=True, help="Exact CSAF product_id, not a display name")
    args = parser.parse_args(argv)
    try:
        print(json.dumps(preview(fetch_document(args.url), args.url, args.cve, args.product_id),
                         sort_keys=True, indent=2))
        return 0
    except (OSError, ValueError) as exc:
        print(f"MSRC preview failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
