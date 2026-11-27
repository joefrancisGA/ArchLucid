"""Named Aspects command isolation and mutation evidence, using synthetic Git."""
import hashlib
import json
from math import fsum
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_commands as commands


class NamedAspectsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.test')
        for i in range(42):
            self.write(f'Core/P{i:02}.cs', 'one\ntwo\n')
        for i in range(12):
            self.write(f'Core.Tests/P{i:02}Tests.cs', 'assertion\n')
        self.write('Core.Tests/TenantIsolationTests.cs', 'assertion\n')
        self.write('infra/main.tf', 'resource\n')
        self.target = 'ApplicationGraphMergeProperties'
        self.write(commands.SCOPED_TARGETS[self.target], json.dumps({'stryker-config': {
            'project': 'Core/Core.csproj', 'mutate': ['**/Gate.cs'], 'test-case-filter': 'FullyQualifiedName~GateTests',
            'test-projects': ['Core.Tests/Core.Tests.csproj'], 'reporters': ['json'],
        }}))
        self.git('add', '-A')
        self.git('commit', '-qm', 'fixture')
        self.head = self.git('rev-parse', 'HEAD')

    def git(self, *args):
        return subprocess.run(['git', '-C', str(self.repo), *args],
                              check=True, capture_output=True, text=True).stdout.strip()

    def write(self, path, text):
        target = self.repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding='utf-8')
        return target

    def test_defaults_and_risk_priority(self):
        prod = commands.review_plan(self.repo, 'aspects', self.head)
        test = commands.review_plan(self.repo, 'test-aspects', self.head)
        self.assertEqual(prod['requested_files'], 40)
        self.assertEqual(len(prod['candidates']), 40)
        self.assertEqual(len(test['candidates']), 10)
        self.assertTrue(all(x['lane'] == 'production' for x in prod['candidates']))
        self.assertTrue(all(x['lane'] == 'test' for x in test['candidates']))
        self.assertIn('TenantIsolationTests.cs', test['candidates'][0]['path'])
        self.assertEqual(len(commands.review_plan(self.repo, 'aspects', self.head, 3)['candidates']), 3)
        self.assertFalse(commands.ledger_path(self.repo, 'test-aspects').exists())

    def test_production_cli_defaults_to_40_files_without_an_explicit_limit(self):
        runner = Path(commands.__file__).resolve()
        args = [sys.executable, str(runner), '--repo', str(self.repo),
                'aspects', 'plan', '--head', self.head]
        plan = json.loads(subprocess.run(args, check=True, capture_output=True, text=True).stdout)
        self.assertEqual(plan['requested_files'], 40)
        self.assertEqual(len(plan['candidates']), 40)
        override = json.loads(
            subprocess.run([*args, '--limit', '35'], check=True, capture_output=True, text=True).stdout)
        self.assertEqual(override['requested_files'], 35)
        self.assertEqual(override['candidates'], plan['candidates'][:35])

    def test_ledger_and_density_isolation(self):
        commands.record_lane_review(self.repo, 'aspects', self.head, 'Core/P00.cs',
                                    ['1-2'], 'p1', 'defect', 'P-1')
        args = (self.repo, 'test-aspects', self.head, 'Core.Tests/P00Tests.cs',
                ['1'], 't1', 'defect', 'T-1')
        self.assertTrue(commands.record_lane_review(
            *args, notes='Independent wrong-tenant assertion absent',
            category='authorization-isolation', severity='critical'))
        self.assertFalse(commands.record_lane_review(
            *args, notes='Same evidence', category='authorization-isolation', severity='critical'))
        self.assertEqual(commands.review_report(self.repo, 'aspects')['latest']['cumulative_path_blob_loc'], 2)
        report = commands.review_report(self.repo, 'test-aspects')
        self.assertEqual(report['latest']['cumulative_path_blob_loc'], 1)
        self.assertEqual(report['latest']['cumulative_defects'], 1)
        self.assertEqual(report['defects_by_severity'], {'critical': 1})
        self.assertIsNone(report['latest']['sma25'])
        self.assertNotIn('Core.Tests/P00Tests.cs', [
            row['path'] for row in commands.review_plan(self.repo, 'test-aspects', self.head)['candidates']])

    def test_cross_lane_and_unsupported_claims_rejected(self):
        with self.assertRaisesRegex(ValueError, 'only production'):
            commands.record_lane_review(self.repo, 'aspects', self.head,
                'Core.Tests/P00Tests.cs', ['1'], 'bad', 'clean')
        with self.assertRaisesRegex(ValueError, 'notes'):
            commands.record_lane_review(self.repo, 'test-aspects', self.head,
                'Core.Tests/P00Tests.cs', ['1'], 'bad', 'clean')
        with self.assertRaisesRegex(ValueError, 'category and severity'):
            commands.record_lane_review(self.repo, 'test-aspects', self.head,
                'Core.Tests/P00Tests.cs', ['1'], 'bad', 'defect', 'T-bad', notes='evidence')
        with self.assertRaisesRegex(ValueError, 'positive'):
            commands.review_plan(self.repo, 'test-aspects', self.head, 0)

    def test_moving_windows_and_no_duplicate_loc_or_defect_credit(self):
        rows = []
        for i in range(701):
            rows.append({'verified': True, 'review_track': 'systematic',
                         'review_outcome': 'defect' if i < 2 else 'clean',
                         'defect_id': 'shared' if i < 2 else None,
                         'review_id': str(i), 'path': str(i), 'blob': 'blob',
                         'baseline': self.head, 'spans': [[1, 1]]})
        series = commands.density_series(rows + [rows[-1], rows[0]])
        self.assertEqual(len(series), 701)
        self.assertEqual(series[-1]['cumulative_defects'], 1)
        self.assertEqual(series[-1]['cumulative_path_blob_loc'], 701)
        self.assertIsNone(series[23]['sma25'])
        self.assertIsNone(series[698]['sma700'])
        # This fixture contributes one distinct defect and one new line at each
        # successive cumulative denominator, independent of the reported series.
        for key, width, end, start in [
            ('sma25', 25, 25, 1), ('sma25', 25, 26, 2),
            ('sma700', 700, 700, 1), ('sma700', 700, 701, 2),
        ]:
            with self.subTest(window=width, observation=end):
                expected = fsum(1000 / denominator for denominator in range(start, end + 1)) / width
                self.assertAlmostEqual(series[end - 1][key], expected, places=10)
        self.assertLess(commands.trend_slope(series), 0)

    def test_mutation_plan_reuses_scope_and_is_bounded(self):
        plan = commands.mutation_plan(self.repo, self.head, self.target, 10)
        self.assertEqual(plan['mutate'], ['**/Gate.cs'])
        self.assertEqual(plan['budget_minutes'], 10)
        command = plan['mutation_command']
        self.assertEqual(command[command.index('--config') + 1], commands.SCOPED_TARGETS[self.target])
        self.assertEqual(command[command.index('--budget-seconds') + 1], '600')
        self.assertIn('plan-only', plan['status'])
        with self.assertRaises(ValueError):
            commands.mutation_plan(self.repo, self.head, self.target, 31)
        with self.assertRaises(ValueError):
            commands.mutation_plan(self.repo, self.head, 'Application', 10)

    def mutation_fixture(self, statuses):
        return {'schemaVersion': '2', 'projectRoot': '/fixture/Core', 'files': {'/fixture/Core/Gate.cs': {
            'mutants': [{'id': str(i), 'status': status} for i, status in enumerate(statuses)],
        }}}

    def test_mutation_assertion_kills_are_not_infrastructure_failures(self):
        statuses = ['Killed', 'Survived', 'NoCoverage', 'Timeout', 'RuntimeError', 'CompileError', 'Ignored']
        data = self.mutation_fixture(statuses)
        counts = commands.mutation_counts(data)
        self.assertEqual(counts['assertion_kill_percent'], 50)
        self.assertAlmostEqual(counts['coverage_inclusive_kill_percent'], 100/3)
        self.assertEqual(counts['official_score_percent'], 50)
        self.assertEqual(len(counts['survivor_candidates']), 2)
        path = self.write('report.json', json.dumps(data))
        plan = commands.mutation_plan(self.repo, self.head, self.target, 10)
        receipt = {'schema_version': 1, 'tool_version': '4.16.0', 'head': self.head, 'target': self.target,
                   'config_sha256': plan['config_sha256'], 'project_dir': 'Core', 'base': None,
                   'exit_code': 0, 'mutants_created': len(statuses), 'initial_tests_found': 1,
                   'report_sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'tool_score_percent': 50}
        receipt_path = self.write('receipt.json', json.dumps(receipt))
        args = (self.repo, self.head, self.target, path, 'fixture artifact', 'fixture green baseline', 10, receipt_path)
        first = commands.record_mutation(*args)
        again = commands.record_mutation(*args)
        self.assertTrue(first['appended'])
        self.assertFalse(again['appended'])
        self.assertFalse(commands.ledger_path(self.repo, 'aspects').exists())
        path.write_text(json.dumps(data) + ' ')
        with self.assertRaisesRegex(ValueError, 'digest'):
            commands.record_mutation(*args)

    def test_pending_and_unknown_are_not_a_completed_score(self):
        for status in ('Pending', 'NewStatus'):
            self.assertIsNone(commands.mutation_counts(self.mutation_fixture(['Killed', status]))['assertion_kill_percent'])
        data = self.mutation_fixture(['Killed', 'Survived'])
        data['files']['/fixture/Core/Gate.cs']['mutants'][1]['id'] = '0'
        with self.assertRaisesRegex(ValueError, 'duplicate mutant'):
            commands.mutation_counts(data)
        with self.assertRaises(ValueError):
            commands.mutation_counts({'mutationScore': 100})


if __name__ == '__main__':
    unittest.main()
