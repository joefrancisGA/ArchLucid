"""Focused synthetic-Git tests for systematic Aspects inventory and file age."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('aspects_systematic_review', SCRIPTS / 'aspects_systematic_review.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SystematicReviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        self.run_git('init', '-q')
        self.run_git('config', 'user.name', 'Aspects Fixture')
        self.run_git('config', 'user.email', 'aspects@example.test')
        self.write('Core/old.cs', 'one\n\nthree\nfour\n')
        self.write('node_modules/vendor.ts', 'excluded\n')
        self.commit('2020-01-02T03:04:05+00:00', 'old')
        self.old_head = self.head()
        self.write('Core/updated.cs', 'header\nbody\n')
        self.write('Core.Tests/ReviewTests.cs', 'test\n')
        self.write('src/data.generated.ts', 'generated\n')
        self.write('infra/main.tf', 'resource "a" "b" {}\n')
        self.commit('2022-02-03T04:05:06+00:00', 'add more')
        self.write('Core/updated.cs', 'header\nbody\nadded\n')
        self.commit('2024-03-04T05:06:07+00:00', 'modify latest')
        self.sha = self.head()
        self.ledger = self.repo / 'review.jsonl'

    def run_git(self, *args, env=None):
        return subprocess.run(['git', '-C', str(self.repo), *args],
                              check=True, capture_output=True, env=env).stdout.decode().strip()

    def write(self, path, content):
        absolute = self.repo / path
        absolute.parent.mkdir(parents=True, exist_ok=True)
        absolute.write_text(content, encoding='utf-8')

    def commit(self, when, message):
        self.run_git('add', '-A')
        env = dict(os.environ, GIT_AUTHOR_DATE=when, GIT_COMMITTER_DATE=when)
        self.run_git('commit', '-qm', message, env=env)

    def head(self):
        return self.run_git('rev-parse', 'HEAD')

    def test_inventory_includes_all_code_lanes_and_oldest_first_queue(self):
        inv = module.build_inventory(self.repo, self.sha, [])
        self.assertEqual(inv['summary']['eligible_files'], 4)
        self.assertEqual(inv['summary']['eligible_nonblank_loc'], 8)
        self.assertEqual(inv['summary']['systematic_reviewed_nonblank_loc'], 0)
        self.assertEqual(inv['summary']['systematic_coverage_percent'], 0)
        self.assertEqual(inv['next_review_candidates'][0]['path'], 'Core/old.cs')
        by_path = {row['path']: row for row in inv['files']}
        self.assertEqual(by_path['Core/old.cs']['nonblank_loc'], 3)
        self.assertEqual(by_path['Core/updated.cs']['nonblank_loc'], 3)
        self.assertEqual(by_path['Core.Tests/ReviewTests.cs']['lane'], 'test')
        self.assertEqual(by_path['infra/main.tf']['lane'], 'infrastructure')
        self.assertNotIn('node_modules/vendor.ts', by_path)
        self.assertNotIn('src/data.generated.ts', by_path)

    def test_record_clean_systematic_counts_exact_verified_nonblank_and_ages(self):
        first = module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                                     ['1', '3-4'], 'review-101', 'systematic',
                                     'clean', None, 'not-assessed', None)
        again = module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                                     ['1', '3-4'], 'review-101', 'systematic',
                                     'clean', None, 'not-assessed', None)
        self.assertTrue(first)
        self.assertFalse(again)
        result = module.build_inventory(self.repo, self.sha,
                                        module.read_records(self.ledger), review_id='review-101')
        self.assertEqual(result['summary']['systematic_reviewed_nonblank_loc'], 3)
        self.assertEqual(result['summary']['observations']['systematic_clean'], 1)
        self.assertEqual(result['summary']['lanes']['production']['fully_reviewed_files'], 1)
        self.assertEqual(result['next_review_candidates'][0]['path'], 'Core.Tests/ReviewTests.cs')
        oldest = result['oldest_source_file_reviewed']
        self.assertEqual(oldest['path'], 'Core/old.cs')
        self.assertEqual(oldest['first_seen']['utc'], '2020-01-02T03:04:05+00:00')
        self.assertEqual(oldest['last_modified_pre_review']['utc'], '2020-01-02T03:04:05+00:00')

    def test_legacy_verified_source_is_known_but_not_systematic_completion(self):
        old_blob = self.run_git('rev-parse', f'{self.sha}:Core/old.cs')
        evidence = [{'baseline': self.sha, 'blob': old_blob,
                     'path': 'Core/old.cs', 'spans': [[1, 1]],
                     'verified': True, 'defect_id': 'OLD-1'}]
        result = module.build_inventory(self.repo, self.sha, evidence)
        self.assertEqual(result['summary']['systematic_reviewed_nonblank_loc'], 0)
        self.assertEqual(result['summary']['known_verified_current_blob_nonblank_loc'], 1)
        self.assertEqual(result['summary']['observations']['legacy_verified'], 1)
        self.assertGreater(result['summary']['known_current_blob_subset_coverage_percent'], 0)

    def test_targeted_discovery_does_not_inflate_systematic_coverage(self):
        module.record_review(self.repo, self.ledger, self.sha, 'Core/updated.cs',
                             ['1-3'], 'hunt-100', 'targeted', 'defect',
                             'BUG-100', 'gap', 'shared-policy-validation')
        result = module.build_inventory(self.repo, self.sha, module.read_records(self.ledger),
                                        review_id='hunt-100')
        self.assertEqual(result['summary']['systematic_reviewed_nonblank_loc'], 0)
        self.assertEqual(result['summary']['observations']['targeted'], 1)
        item = next(x for x in result['files'] if x['path'] == 'Core/updated.cs')
        self.assertEqual(item['targeted_reviewed_loc'], 3)
        self.assertEqual(item['systematic_status'], 'not-started')
        age = result['oldest_source_file_reviewed']
        self.assertEqual(age['first_seen']['utc'], '2022-02-03T04:05:06+00:00')
        self.assertEqual(age['last_modified_pre_review']['utc'], '2024-03-04T05:06:07+00:00')

    def test_stale_verified_blob_and_current_unverified_blob_are_excluded_independently(self):
        path = 'Core/updated.cs'
        previous = self.run_git('rev-parse', f'{self.sha}^')
        module.record_review(self.repo, self.ledger, previous, path,
                             ['1-2'], 'older-review', 'systematic', 'clean', None, 'not-assessed', None)
        module.record_review(self.repo, self.ledger, self.sha, path,
                             ['1-3'], 'current-review', 'systematic', 'clean', None, 'not-assessed', None)
        stale, current = module.read_records(self.ledger)
        self.assertNotEqual(stale['blob'], current['blob'])
        for reason, row in [('stale verified', stale), ('current unverified', {**current, 'verified': False})]:
            with self.subTest(reason=reason):
                result = module.build_inventory(self.repo, self.sha, [row])
                self.assertEqual(result['summary']['systematic_reviewed_nonblank_loc'], 0)
                self.assertEqual(result['summary']['known_verified_current_blob_nonblank_loc'], 0)
                self.assertEqual(result['summary']['observations']['systematic'], 0)
                candidate = next(x for x in result['next_review_candidates'] if x['path'] == path)
                self.assertEqual(candidate['systematic_status'], 'not-started')
        verified = module.build_inventory(self.repo, self.sha, [current])
        self.assertEqual(verified['summary']['systematic_reviewed_nonblank_loc'], 3)
        self.assertNotIn(path, [x['path'] for x in verified['next_review_candidates']])

    def test_pass_reports_oldest_introduced_of_multiple_reviewed_files(self):
        module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                             ['1'], 'pass-2', 'systematic', 'clean', None,
                             'compliant', 'shared-contract')
        module.record_review(self.repo, self.ledger, self.sha, 'Core/updated.cs',
                             ['1'], 'pass-2', 'systematic', 'defect', 'ASPECTS-D2',
                             'gap', 'shared-contract')
        out = module.build_inventory(self.repo, self.sha, module.read_records(self.ledger),
                                     review_id='pass-2')
        self.assertEqual(out['oldest_source_file_reviewed']['path'], 'Core/old.cs')
        self.assertEqual(out['summary']['observations']['systematic_clean'], 1)
        self.assertEqual(out['summary']['observations']['systematic_defect'], 1)
        self.assertEqual(out['summary']['observations']['architecture_compliant'], 1)
        self.assertEqual(out['summary']['observations']['architecture_gaps'], 1)
        self.assertGreater(out['oldest_source_file_reviewed']['days_since_last_change_as_of_report'], 365)

    def test_rename_follow_preserves_earliest_file_history(self):
        self.run_git('mv', 'Core/old.cs', 'Core/renamed.cs')
        self.commit('2025-02-03T04:05:06+00:00', 'rename only')
        head = self.head()
        module.record_review(self.repo, self.ledger, head, 'Core/renamed.cs',
                             ['1', '3-4'], 'renamed-review', 'systematic', 'clean', None,
                             'not-applicable', None)
        out = module.build_inventory(self.repo, head, module.read_records(self.ledger),
                                     review_id='renamed-review')
        age = out['oldest_source_file_reviewed']
        self.assertEqual(age['first_seen']['utc'], '2020-01-02T03:04:05+00:00')
        self.assertEqual(age['last_modified_pre_review']['utc'], '2025-02-03T04:05:06+00:00')

    def test_plan_cli_writes_file_age_csv_and_inventory_json(self):
        import csv
        import json
        module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                             ['1'], 'pass-csv', 'systematic', 'clean', None,
                             'compliant', 'policy-shared')
        inventory = self.repo / 'inventory.json'
        export = self.repo / 'review-age.csv'
        subprocess.run([sys.executable, str(SCRIPTS / 'aspects_systematic_review.py'),
                        '--repo', str(self.repo), '--ledger', str(self.ledger),
                        'plan', '--head', self.sha, '--review-id', 'pass-csv',
                        '--json-out', str(inventory), '--csv-out', str(export)],
                       check=True, capture_output=True)
        data = json.loads(inventory.read_text(encoding='utf-8'))
        with export.open(encoding='utf-8', newline='') as stream:
            rows = list(csv.DictReader(stream))
        self.assertEqual(data['oldest_source_file_reviewed']['path'], 'Core/old.cs')
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['review_id'], 'pass-csv')
        self.assertEqual(rows[0]['source_path'], 'Core/old.cs')
        self.assertEqual(rows[0]['last_modified_pre_review_sha'], self.old_head)
        self.assertEqual(rows[0]['architectural_control'], 'policy-shared')

    def test_reject_misrepresented_reviews(self):
        with self.assertRaisesRegex(ValueError, 'defect review'):
            module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                                 ['1'], 'review-1', 'systematic', 'defect', None, 'not-assessed', None)
        with self.assertRaisesRegex(ValueError, 'clean review'):
            module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                                 ['1'], 'review-1', 'systematic', 'clean', 'D1', 'not-assessed', None)
        with self.assertRaisesRegex(ValueError, 'blank'):
            module.record_review(self.repo, self.ledger, self.sha, 'Core/old.cs',
                                 ['1-3'], 'review-1', 'systematic', 'clean', None, 'not-assessed', None)
        with self.assertRaisesRegex(ValueError, 'eligible source code'):
            module.record_review(self.repo, self.ledger, self.sha, 'node_modules/vendor.ts',
                                 ['1'], 'review-1', 'systematic', 'clean', None, 'not-assessed', None)

    def test_reviewed_older_source_file_has_pre_repair_last_touch(self):
        module.record_review(self.repo, self.ledger, self.old_head, 'Core/old.cs',
                             ['1', '3-4'], 'review-old', 'systematic', 'clean', None, 'compliant', 'shared-guard')
        # The same unchanged blob stays covered at later HEAD; age is pinned to original baseline.
        later = module.build_inventory(self.repo, self.sha, module.read_records(self.ledger),
                                       review_id='review-old')
        self.assertEqual(later['summary']['systematic_reviewed_nonblank_loc'], 3)
        self.assertEqual(later['oldest_source_file_reviewed']['last_modified_pre_review']['sha'], self.old_head)


if __name__ == '__main__':
    unittest.main()
