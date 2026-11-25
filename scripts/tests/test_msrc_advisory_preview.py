import io
import json
import unittest

from scripts.securenow import msrc_advisory_preview as msrc


URL = "https://msrc.microsoft.com/csaf/vex/2026/msrc_cve-2026-12345.json"


def document():
    return {
        "document": {
            "csaf_version": "2.0",
            "publisher": {
                "category": "vendor",
                "name": "Microsoft Security Response Center",
                "namespace": "https://www.microsoft.com",
            },
            "tracking": {
                "id": "msrc_CVE-2026-12345", "version": "2",
                "current_release_date": "2026-11-10T02:00:00-05:00",
            },
        },
        "product_tree": {"branches": [{"branches": [
            {"product": {"product_id": "123"}}, {"product": {"product_id": "124"}},
        ]}]},
        "vulnerabilities": [{
            "cve": "CVE-2026-12345",
            "product_status": {"fixed": ["123"], "known_affected": ["124"]},
        }],
    }


class PreviewTests(unittest.TestCase):
    def test_exact_product_preserves_vendor_status_and_dates_but_never_decides(self):
        result = msrc.preview(json.dumps(document()).encode(), URL, " cve-2026-12345 ", "123")
        self.assertEqual(["fixed"], result["reported_product_statuses"])
        self.assertEqual("2026-11-10T07:00:00+00:00", result["publisher_release_utc"])
        self.assertEqual("review_required", result["decision"])
        self.assertEqual(64, len(result["source_sha256"]))
        self.assertNotIn("customer_action", result)

    def test_product_status_never_crosses_product_or_cve(self):
        raw = json.dumps(document()).encode()
        self.assertEqual(["known_affected"], msrc.preview(raw, URL, "CVE-2026-12345", "124")["reported_product_statuses"])
        for cve, product in [("CVE-2026-12346", "123"), ("CVE-2026-12345", "12")]:
            with self.subTest(cve=cve, product=product), self.assertRaises(ValueError):
                msrc.preview(raw, URL, cve, product)

    def test_unlisted_status_is_unknown_not_not_affected(self):
        obj = document()
        obj["vulnerabilities"][0]["product_status"] = {"fixed": ["124"]}
        self.assertEqual([], msrc.preview(json.dumps(obj).encode(), URL,
                                         "CVE-2026-12345", "123")["reported_product_statuses"])

    def test_rejects_unknown_publisher_and_duplicate_members(self):
        obj = document()
        obj["document"]["publisher"]["name"] = "Other publisher"
        for raw in [json.dumps(obj).encode(), b'{"document":{},"document":{}}']:
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                msrc.preview(raw, URL, "CVE-2026-12345", "123")

    def test_rejects_other_origins_or_non_document_urls(self):
        for url in [URL.replace("https:", "http:"), URL.replace(".com/", ".com.evil/"), URL + "?x=1",
                    URL.replace("/2026/", "/2026/%2e%2e/"), URL.replace("msrc.microsoft.com", "msrc.microsoft.com@evil")]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                msrc.fetch_document(url)

    def test_rejects_redirects_and_limits_download(self):
        self.assertIsNone(msrc._NoRedirect().redirect_request(None, None, 302, "", {}, URL))

        class Opener:
            def __init__(self, url, length):
                self.url, self.length = url, length

            def open(self, request, timeout):
                response = io.BytesIO(b"x" * self.length)
                response.geturl = lambda: self.url
                return response

        for opener in [Opener(URL + ".other", 1), Opener(URL, msrc.MAX_BYTES + 1)]:
            with self.assertRaises(ValueError):
                msrc.fetch_document(URL, opener)
