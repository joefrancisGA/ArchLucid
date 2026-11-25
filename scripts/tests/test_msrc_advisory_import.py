import base64
import hashlib
import json
import unittest
from uuid import UUID

from scripts.securenow import msrc_advisory_import as imp
from scripts.tests.test_msrc_advisory_preview import URL, document

ID = [str(UUID(int=i)) for i in range(1, 7)]
SCOPE = dict(zip(imp.SCOPE_FIELDS, ID[:3]))
RAW = json.dumps(document()).encode()
LEGACY_HASH = base64.b64encode(b"x" * 32).decode()


def manifest():
    return {
        "scope": SCOPE,
        "advisories": [{
            "url": URL, "cve": "CVE-2026-12345", "productId": "123",
            "sha256": hashlib.sha256(RAW).hexdigest(),
            "targetKey": "app/runtime", "cloudResourceId": ID[3],
            "remediation": {"owner": "Customer", "providerFix": "Unknown", "customerAction": "Required"},
        }],
        "legacyAliases": [{
            "legacyFindingId": ID[4], "payloadHashSha256": LEGACY_HASH,
            "cve": "CVE-2026-12345", "targetKey": "app/runtime", "cloudResourceId": ID[3],
        }],
    }


def detail():
    return {
        "finding": {**SCOPE, "findingId": ID[4], "cloudResourceId": ID[3], "provider": "Azure",
                    "sourceSystem": "Defender", "sourceFindingId": "old-row",
                    "payloadHashSha256": LEGACY_HASH},
        "metadata": [{"metadataKey": imp.EVIDENCE, "metadataValue": json.dumps({
            "advisoryId": "CVE-2026-12345", "sourceUrl": "https://example.com/legacy",
            "owner": "Provider", "providerFix": "Fixed", "customerAction": "NotRequired",
        })}],
    }


class FakeClient:
    def __init__(self, reply=None, fail=False):
        self.calls = []
        self.reply = reply if reply is not None else detail()
        self.fail = fail

    def request(self, suffix):
        self.calls.append(suffix)
        return self.reply

    def ingest(self, items):
        self.calls.append(items)
        return {"failedCount": int(self.fail), "ingestedCount": int(not self.fail), "deduplicatedCount": 0}


class ImportTests(unittest.TestCase):
    def test_preview_validates_the_document_without_opening_an_api_client(self):
        def no_client(*_):
            self.fail("Dry run must not connect to the ingest API.")

        plan = imp.run(manifest(), fetch=lambda _: RAW, make_client=no_client)
        self.assertFalse(plan["applied"])
        [item] = plan["advisoryItems"]
        self.assertEqual("2026-11-10T07:00:00Z", item["observedUtc"])
        self.assertEqual(ID[3], item["cloudResourceId"])
        self.assertEqual("APP/RUNTIME", json.loads(item["metadata"][imp.ALIAS])["targetKey"])
        # The fixture says 'fixed', but deployment action comes from the reviewed manifest.
        self.assertEqual("Required", json.loads(item["metadata"][imp.EVIDENCE])["customerAction"])

    def test_apply_preflights_legacy_and_then_submits_reference_only(self):
        client = FakeClient()
        result = imp.run(manifest(), apply=True, fetch=lambda _: RAW, make_client=lambda *_: client)
        self.assertTrue(result["applied"])
        lookup, primary, refs = client.calls
        self.assertEqual(ID[4], lookup)
        self.assertEqual("MSRC", primary[0]["sourceSystem"])
        self.assertEqual("Defender", refs[0]["sourceSystem"])
        self.assertTrue(json.loads(refs[0]["metadata"][imp.ALIAS])["referenceOnly"])
        self.assertEqual("Unknown", json.loads(refs[0]["metadata"][imp.EVIDENCE])["customerAction"])
        self.assertEqual("legacy-finding:" + ID[4], refs[0]["rawEvidenceReference"])

    def test_changed_source_bytes_or_incorrect_product_fail(self):
        entry = manifest()["advisories"][0]
        with self.assertRaisesRegex(ValueError, "document bytes changed"):
            imp.build_import(entry, fetch=lambda _: RAW + b" ")
        with self.assertRaisesRegex(ValueError, "exact product"):
            imp.build_import({**entry, "productId": "absent"}, fetch=lambda _: RAW)

    def test_legacy_preflight_failures_make_no_writes(self):
        for key, value in [("projectId", ID[5]), ("cloudResourceId", ID[5]), ("payloadHashSha256", "changed")]:
            reply = detail()
            reply["finding"][key] = value
            client = FakeClient(reply)
            with self.subTest(key=key), self.assertRaises(ValueError):
                imp.run(manifest(), apply=True, fetch=lambda _: RAW, make_client=lambda *_: client)
            self.assertEqual([ID[4]], client.calls)

    def test_authoritative_failure_does_not_attempt_legacy_replay(self):
        client = FakeClient(fail=True)
        result = imp.run(manifest(), apply=True, fetch=lambda _: RAW, make_client=lambda *_: client)
        self.assertEqual(1, result["authoritative"]["failedCount"])
        self.assertEqual({}, result["legacyReferences"])
        self.assertEqual(2, len(client.calls))

    def test_ambiguous_duplicate_mappings_fail_before_api_use(self):
        for key in ("advisories", "legacyAliases"):
            data = manifest()
            data[key].append(data[key][0])
            with self.subTest(key=key), self.assertRaises(ValueError):
                imp.run(data, apply=True, fetch=lambda _: RAW,
                        make_client=lambda *_: self.fail("Ambiguous plan must not access the API."))

    def test_scoped_client_rejects_insecure_api_origins(self):
        for origin in ("http://example.com", "https://user@example.com", "https://example.com/path"):
            with self.subTest(origin=origin), self.assertRaises(ValueError):
                imp.ScopedClient(origin, "token", SCOPE)

    def test_scoped_client_uses_project_headers_and_bounds_result(self):
        import io

        class Opener:
            def open(self, request, timeout):
                headers = dict(request.header_items())
                self_request = json.loads(request.data)
                self_test.assertEqual(ID[2], headers["X-project-id"])
                self_test.assertEqual({"items": [{"title": "fixture"}]}, self_request)
                self_test.assertEqual("https://example.com/v1/operational-security/findings/ingest", request.full_url)
                response = io.BytesIO(b'{"ingestedCount":1,"deduplicatedCount":0,"failedCount":0}')
                response.geturl = lambda: request.full_url
                return response

        self_test = self
        client = imp.ScopedClient("https://example.com", "token", SCOPE, opener=Opener())
        self.assertEqual(1, client.ingest([{"title": "fixture"}])["ingestedCount"])
