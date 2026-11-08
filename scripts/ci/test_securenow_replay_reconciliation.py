"""python3 -m unittest discover -s scripts/ci -p test_securenow_replay_reconciliation.py"""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

FILE = Path(__file__).resolve().parents[1] / 'securenow' / 'reconcile_replay.py'
spec = importlib.util.spec_from_file_location('securenow_reconcile_replay', FILE)
assert spec and spec.loader
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)

SUB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
RESOURCE = '/subscriptions/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/resourcegroups/rg/providers/microsoft.web/sites/app'
PACKAGE_HASH = 'a' * 64
FINGERPRINT = 'abcdef1234'


def api_question(resource=RESOURCE, fingerprint=FINGERPRINT, source='InventoryEvidence'):
    return {'subscriptionId': SUB, 'snapshotId': 'snapshot-a', 'source': source,
            'questionKey': 'unknown-evidence@v1', 'resourceId': resource,
            'evidenceFingerprint': fingerprint}


def native_question(resource=RESOURCE, fingerprint=FINGERPRINT):
    return {'source': 'InventoryEvidence', 'questionKey': 'unknown-evidence@v1',
            'resourceSha256': hashlib.sha256(resource.encode()).hexdigest(),
            'evidenceFingerprint': fingerprint}


class ReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.native = self.root / 'native'
        self.native.mkdir()
        self.exports = self.root / 'exports'
        self.exports.mkdir()
        self.coverage = {'schema': 'securenow.evidence-lab.v1',
                         'notCollectedSubscriptions': ['another-sub'],
                         'subscriptions': [{'subscriptionId': SUB, 'packageSha256': PACKAGE_HASH,
                                           'questionQueueStatus': 'Provided', 'questionCount': 1}]}

    def save(self, native=None, api=None):
        if native is not None:
            (self.native / (SUB + '.native.json')).write_text(json.dumps({
                'schema': 'securenow.offline-native-questions.v1',
                'status': 'PARTIAL_QUESTION_REPLAY', 'subscriptionId': SUB,
                'packageSha256': PACKAGE_HASH, 'questionCount': len(native),
                'questions': native,
            }))
        if api is not None:
            (self.exports / (SUB + '.questions.json')).write_text(json.dumps(api))

    def test_exact_inventory_parity(self):
        self.save([native_question()], [api_question()])
        r = lab.compare(self.coverage, self.native, self.exports)
        self.assertEqual(r['subscriptions'][0]['state'], 'MATCHED_PARTIAL_SLICE')
        self.assertEqual(r['subscriptions'][0]['matchedQuestions'], 1)
        self.assertFalse(r['subscriptions'][0]['questionSourceSnapshotVerified'])

    def test_unrelated_policy_question_not_mistaken_as_inventory_drift(self):
        self.coverage['subscriptions'][0]['questionCount'] = 2
        self.save([native_question()], [api_question(), api_question(source='PolicyPack')])
        r = lab.compare(self.coverage, self.native, self.exports)['subscriptions'][0]
        self.assertEqual(r['state'], 'MATCHED_PARTIAL_SLICE')
        self.assertEqual(r['exportedOtherQuestions'], 1)

    def test_fingerprint_drift_requires_review(self):
        self.save([native_question()], [api_question(fingerprint='changed')])
        r = lab.compare(self.coverage, self.native, self.exports)['subscriptions'][0]
        self.assertEqual(r['state'], 'REVIEW_REQUIRED')
        self.assertEqual(r['fingerprintDrift'], 1)
        self.assertNotIn(RESOURCE, json.dumps(r))

    def test_api_only_and_native_only(self):
        self.save([native_question()], [api_question(resource=RESOURCE+'-other')])
        r = lab.compare(self.coverage, self.native, self.exports)['subscriptions'][0]
        self.assertEqual((r['nativeOnly'], r['apiOnly']), (1, 1))

    def test_missing_original_export_does_not_claim_zero_questions(self):
        self.save([native_question()], None)
        r = lab.compare(self.coverage, self.native, self.exports)['subscriptions'][0]
        self.assertEqual(r['state'], 'NOT_COMPARABLE')
        self.assertFalse(r['exportPresent'])

    def test_reject_wrong_native_zip_hash(self):
        self.save([native_question()], [api_question()])
        path = self.native / (SUB + '.native.json')
        data = json.loads(path.read_text())
        data['packageSha256'] = 'b' * 64
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'package SHA-256 mismatch'):
            lab.compare(self.coverage, self.native, self.exports)

    def test_reject_cross_subscription_question(self):
        self.save([native_question()], [dict(api_question(), subscriptionId='foreign')])
        with self.assertRaisesRegex(ValueError, 'Cross-subscription'):
            lab.compare(self.coverage, self.native, self.exports)

    def test_reject_duplicate_question_key(self):
        self.save([native_question(), native_question()], [api_question()])
        with self.assertRaisesRegex(ValueError, 'Duplicate normalized'):
            lab.compare(self.coverage, self.native, self.exports)

    def test_reject_mixed_snapshots(self):
        self.coverage['subscriptions'][0]['questionCount'] = 2
        second = dict(api_question(), snapshotId='snapshot-b', resourceId=RESOURCE+'-different')
        self.save([native_question()], [api_question(), second])
        with self.assertRaisesRegex(ValueError, 'snapshot mismatch'):
            lab.compare(self.coverage, self.native, self.exports)

    def test_fail_on_drift_exit_code(self):
        self.save([native_question()], [api_question(fingerprint='different')])
        coverage_path = self.root / 'evidence.json'
        coverage_path.write_text(json.dumps(self.coverage))
        result = lab.main(['--coverage-report', str(coverage_path),
                           '--native-dir', str(self.native),
                           '--questions-dir', str(self.exports),
                           '--out', str(self.root / 'result.json'), '--fail-on-drift'])
        self.assertEqual(result, 3)
        self.assertTrue((self.root / 'result.json').exists())


if __name__ == '__main__':
    unittest.main()
