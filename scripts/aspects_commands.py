#!/usr/bin/env python3
"""Owner-facing Aspects command router; planning and evidence, not autonomous review."""
from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

from aspects_review_evidence import SHA, normalize_path, parse_spans, read_records
from aspects_systematic_review import (
    ARCH_STATUSES, build_inventory, classify, git, record_review,
)
from ci.stryker_pr_plan import FULL_MATRIX

LANES = {'aspects': ('production', 35, 'aspects-review-ledger.jsonl'),
         'test-aspects': ('test', 10, 'test-aspects-review-ledger.jsonl')}
TEST_CATEGORIES = (
    'false-pass', 'mocked-subject', 'authorization-isolation', 'coupled-oracle',
    'missing-boundary', 'exception-assertion', 'false-concurrency',
    'integration-gap', 'flaky', 'redundant', 'other',
)
SEVERITIES = ('critical', 'high', 'medium', 'low')
RISK_WORDS = ('tenant', 'isolation', 'authoriz', 'authenticat', 'governance',
              'scope', 'integrity', 'immutab', 'provenance', 'commitgate',
              'reachability', 'privilege', 'cutpoint', 'securityevidence')
SCOPED_TARGETS = {label: config for label, config in FULL_MATRIX if label in {
    'ApplicationGovernance', 'ApplicationCommitCriticalPaths',
    'ApplicationGraphMergeProperties', 'DecisioningMerge',
}}
KNOWN_MUTATION_STATUSES = {
    'Killed', 'Survived', 'NoCoverage', 'Timeout', 'RuntimeError',
    'CompileError', 'Ignored', 'Pending',
}


def ledger_path(repo: Path, command: str) -> Path:
    name = ('mutation-aspects-ledger.jsonl' if command == 'mutation-aspects'
            else LANES[command][2])
    return repo / 'docs' / 'engineering' / name


def lane_rows(repo: Path, command: str) -> list[dict]:
    lane = LANES[command][0]
    return [row for row in read_records(ledger_path(repo, command))
            if classify(row['path']) == lane]


def review_plan(repo: Path, command: str, head: str, limit: int | None = None) -> dict:
    lane, default, _ = LANES[command]
    limit = default if limit is None else limit
    if type(limit) is not int or limit <= 0:
        raise ValueError('Review batch size must be positive')
    # Select the lane BEFORE slicing the queue. Critical test candidates go first;
    # within each risk bucket preserve the existing verified/oldest-first order.
    inventory = build_inventory(repo, head, lane_rows(repo, command),
                                next_limit=2**31 - 1 if lane == 'test' else limit,
                                lane=lane)
    queue = inventory['next_review_candidates']
    if lane == 'test':
        queue.sort(key=lambda row: not any(
            word in row['path'].lower() for word in RISK_WORDS))
    return {'command': command, 'lane': lane, 'requested_files': limit,
            'summary': inventory['summary'],
            'candidates': queue[:limit], 'remaining_candidates_at_least': len(queue),
            'status': 'plan-only; no source review or defect has been recorded',
            'priority': ('risk-keyword heuristic, then existing oldest-first queue'
                         if lane == 'test' else 'existing oldest-first queue')}


def record_lane_review(repo: Path, command: str, baseline: str, path: str,
                       spans: list[str], review_id: str, outcome: str,
                       defect_id: str | None = None, *, notes: str | None = None,
                       category: str | None = None, severity: str | None = None,
                       architecture_status: str = 'not-assessed',
                       architectural_control: str | None = None) -> bool:
    lane = LANES[command][0]
    if classify(normalize_path(path)) != lane:
        raise ValueError(f'{command} accepts only {lane} source files')
    if lane == 'test':
        if not notes or not notes.strip():
            raise ValueError('Test reviews require notes on assertions/oracle and evidence')
        if outcome == 'defect' and (category not in TEST_CATEGORIES or severity not in SEVERITIES):
            raise ValueError('Test defects require an approved category and severity')
        if outcome == 'clean' and (category is not None or severity is not None):
            raise ValueError('Clean test reviews cannot claim a defect category or severity')
    elif category is not None or severity is not None:
        raise ValueError('Test defect metadata belongs only to Test Aspects')
    if defect_id is not None and not defect_id.strip():
        raise ValueError('Defect ID cannot be blank')
    return record_review(repo, ledger_path(repo, command), baseline, path, spans,
                         review_id, 'systematic', outcome, defect_id,
                         architecture_status, architectural_control,
                         finding_category=category, finding_severity=severity,
                         review_notes=notes)


def density_series(rows: list[dict]) -> list[dict]:
    """Append-order observations of new path/blob lines or distinct defects.

    A clean duplicate does not advance a moving average. Changed blobs are
    deliberately NOT reconciled across revisions. No historical estimates enter.
    """
    covered: dict[tuple[str, str], set[int]] = {}
    defects: set[str] = set()
    loc = 0
    rates: list[float] = []
    series: list[dict] = []
    for row in rows:
        if (row.get('verified') is not True or row.get('review_track') != 'systematic'
                or row.get('review_outcome') not in {'clean', 'defect'}):
            continue
        key = (row['path'], row['blob'])
        lines = covered.setdefault(key, set())
        old_count = len(lines)
        for lo, hi in parse_spans(row['spans']):
            lines.update(range(lo, hi + 1))
        added = len(lines) - old_count
        old_defects = len(defects)
        if row.get('review_outcome') == 'defect' and row.get('defect_id'):
            defects.add(row['defect_id'])
        if not added and len(defects) == old_defects:
            continue
        loc += added
        rate = 1000 * len(defects) / loc
        rates.append(rate)
        series.append({
            'observation': len(rates), 'review_id': row['review_id'],
            'path': row['path'], 'baseline': row['baseline'],
            'new_path_blob_loc': added, 'cumulative_path_blob_loc': loc,
            'cumulative_defects': len(defects), 'defects_per_kloc': rate,
            'sma25': sum(rates[-25:]) / 25 if len(rates) >= 25 else None,
            'sma700': sum(rates[-700:]) / 700 if len(rates) >= 700 else None,
        })
    return series


def trend_slope(series: list[dict]) -> float | None:
    """Least-squares change in cumulative density per 100 observations, last 700."""
    rates = [row['defects_per_kloc'] for row in series[-700:]]
    if len(rates) < 2:
        return None
    midpoint = (len(rates) - 1) / 2
    mean = sum(rates) / len(rates)
    return 100 * sum((i - midpoint) * (r - mean) for i, r in enumerate(rates)) / sum(
        (i - midpoint) ** 2 for i in range(len(rates)))


def review_report(repo: Path, command: str) -> dict:
    rows = lane_rows(repo, command)
    series = density_series(rows)
    last = series[-1] if series else None
    distinct = {}
    for row in rows:
        if (row.get('verified') is True and row.get('review_track') == 'systematic'
                and row.get('review_outcome') == 'defect' and row.get('defect_id')):
            distinct.setdefault(row['defect_id'], row)
    return {'command': command, 'lane': LANES[command][0], 'latest': last,
            'series': series, 'slope_per_100_observations': trend_slope(series),
            'defects_by_category': dict(Counter(
                row.get('finding_category') or 'unclassified' for row in distinct.values())),
            'defects_by_severity': dict(Counter(
                row.get('finding_severity') or 'unclassified' for row in distinct.values())),
            'provenance': ('verified systematic path/blob line union only; '
                           'not cross-revision deduplicated, not the legacy production workbook')}


def mutation_plan(repo: Path, head: str, target: str, minutes: int) -> dict:
    if not SHA.fullmatch(head) or target not in SCOPED_TARGETS:
        raise ValueError('Pin a full Git SHA and select one existing critical Stryker target')
    if type(minutes) is not int or not 1 <= minutes <= 30:
        raise ValueError('Mutation budget must be 1–30 minutes')
    config_path = SCOPED_TARGETS[target]
    raw = git(repo, 'show', f'{head}:{config_path}')
    cfg = json.loads(raw)['stryker-config']
    if not cfg.get('mutate') or not cfg.get('test-case-filter') or not cfg.get('test-projects'):
        raise ValueError('Mutation target must have explicit mutate scope and test filter')
    if 'json' not in cfg.get('reporters', []):
        raise ValueError('Mutation target must emit JSON evidence')
    return {'head': head, 'target': target, 'config': config_path,
            'config_sha256': hashlib.sha256(raw).hexdigest(),
            'mutate': cfg['mutate'], 'test_filter': cfg['test-case-filter'],
            'test_projects': cfg['test-projects'], 'budget_minutes': minutes,
            'baseline_commands': [
                ['dotnet', 'test', project, '--filter', cfg['test-case-filter']]
                for project in cfg['test-projects']],
            'mutation_command': ['dotnet', 'dotnet-stryker', '-f', config_path],
            'execution_policy': ('one scoped target in disposable checkout; run baseline first; '
                                 'execution is manual, enforce budget externally; no CI dispatch; '
                                 'use RC49 for any comprehensive build'),
            'status': 'plan-only; no tests or mutants executed'}


def mutation_counts(report: dict) -> dict:
    """Count assertion kills separately from infrastructure failures and untested mutants."""
    files = report.get('files')
    if not isinstance(files, dict) or not files:
        raise ValueError('Expected mutation-testing-elements report with files map')
    counts = Counter()
    candidates = []
    for path, node in sorted(files.items()):
        if not isinstance(node, dict) or not isinstance(node.get('mutants'), list):
            raise ValueError(f'Invalid mutant list for {path}')
        ids = set()
        for mutant in node['mutants']:
            if (not isinstance(mutant, dict) or not isinstance(mutant.get('status'), str)
                    or not isinstance(mutant.get('id'), (str, int))
                    or isinstance(mutant.get('id'), bool)):
                raise ValueError(f'Invalid mutant in {path}')
            identity = str(mutant['id'])
            if identity in ids:
                raise ValueError(f'Duplicate mutant ID in {path}: {identity}')
            ids.add(identity)
            status = mutant['status']
            counts[status if status in KNOWN_MUTATION_STATUSES else 'Unknown'] += 1
            if status in {'Survived', 'NoCoverage'}:
                candidates.append({'path': path, 'id': identity, 'status': status,
                                   'mutator': mutant.get('mutatorName'),
                                   'location': mutant.get('location')})
    killed, survived, uncovered = (counts[s] for s in ('Killed', 'Survived', 'NoCoverage'))
    executed = killed + survived
    complete = counts['Pending'] == counts['Unknown'] == 0
    return {'status_counts': dict(sorted(counts.items())),
            'assertion_kill_percent': 100 * killed / executed if executed and complete else None,
            'coverage_inclusive_kill_percent': (
                100 * killed / (executed + uncovered) if executed + uncovered and complete else None),
            'survivor_candidates': candidates,
            'complete_status_inventory': complete,
            'score_policy': ('timeouts, runtime/compile errors, ignored and pending are not assertion kills; '
                             'survivors require semantic triage, not automatic defect credit')}


def record_mutation(repo: Path, head: str, target: str, report_path: Path,
                    source: str, baseline_evidence: str, minutes: int) -> dict:
    if not source.strip() or not baseline_evidence.strip():
        raise ValueError('Report provenance and successful baseline evidence are required')
    plan = mutation_plan(repo, head, target, minutes)
    raw = report_path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    report = json.loads(raw)
    if not isinstance(report, dict):
        raise ValueError('Expected a JSON report object')
    row = {'head': head, 'target': target, 'config_sha256': plan['config_sha256'],
           'report_sha256': digest, 'source': source,
           'baseline_evidence': baseline_evidence,
           'provenance': 'operator-attested run and baseline; report bytes hashed, not independently rerun',
           'captured_utc': datetime.now(timezone.utc).isoformat(),
           **mutation_counts(report)}
    ledger = ledger_path(repo, 'mutation-aspects')
    if any((old['head'], old['target'], old['report_sha256']) == (head, target, digest)
           for old in read_records(ledger)):
        return {'appended': False, 'report_sha256': digest}
    ledger.parent.mkdir(parents=True, exist_ok=True)
    with ledger.open('a', encoding='utf-8') as out:
        out.write(json.dumps(row, sort_keys=True) + '\n')
    return {'appended': True, **row}


def write_csv(path: Path, series: list[dict]) -> None:
    fields = ['observation', 'review_id', 'path', 'baseline', 'new_path_blob_loc',
              'cumulative_path_blob_loc', 'cumulative_defects', 'defects_per_kloc',
              'sma25', 'sma700']
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='', encoding='utf-8') as out:
        writer = csv.DictWriter(out, fieldnames=fields)
        writer.writeheader()
        writer.writerows(series)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path('.'))
    commands = parser.add_subparsers(dest='command', required=True)
    for name in LANES:
        command = commands.add_parser(name)
        actions = command.add_subparsers(dest='action', required=True)
        plan = actions.add_parser('plan')
        plan.add_argument('--head', required=True)
        plan.add_argument('--limit', type=int)
        record = actions.add_parser('record')
        record.add_argument('--baseline', required=True)
        record.add_argument('--path', required=True)
        record.add_argument('--span', required=True, action='append')
        record.add_argument('--review-id', required=True)
        record.add_argument('--outcome', choices=('clean', 'defect'), required=True)
        record.add_argument('--defect-id')
        record.add_argument('--notes')
        record.add_argument('--category', choices=TEST_CATEGORIES)
        record.add_argument('--severity', choices=SEVERITIES)
        record.add_argument('--architecture-status', choices=ARCH_STATUSES, default='not-assessed')
        record.add_argument('--architectural-control')
        report = actions.add_parser('report')
        report.add_argument('--csv-out', type=Path)
    mutation = commands.add_parser('mutation-aspects')
    actions = mutation.add_subparsers(dest='action', required=True)
    for name in ('plan', 'record'):
        action = actions.add_parser(name)
        action.add_argument('--head', required=True)
        action.add_argument('--target', choices=sorted(SCOPED_TARGETS), required=True)
        action.add_argument('--budget-minutes', type=int, default=30)
        if name == 'record':
            action.add_argument('--report', type=Path, required=True)
            action.add_argument('--source', required=True)
            action.add_argument('--baseline-evidence', required=True)
    actions.add_parser('report')
    args = parser.parse_args()
    if args.command == 'mutation-aspects':
        if args.action == 'plan':
            result = mutation_plan(args.repo, args.head, args.target, args.budget_minutes)
        elif args.action == 'record':
            result = record_mutation(args.repo, args.head, args.target, args.report,
                                     args.source, args.baseline_evidence, args.budget_minutes)
        else:
            result = {'runs': read_records(ledger_path(args.repo, args.command)),
                      'aggregation': 'compare like scope/config only; never combine with LOC density'}
    elif args.action == 'plan':
        result = review_plan(args.repo, args.command, args.head, args.limit)
    elif args.action == 'record':
        result = {'appended': record_lane_review(
            args.repo, args.command, args.baseline, args.path, args.span,
            args.review_id, args.outcome, args.defect_id, notes=args.notes,
            category=args.category, severity=args.severity,
            architecture_status=args.architecture_status,
            architectural_control=args.architectural_control)}
    else:
        result = review_report(args.repo, args.command)
        if args.csv_out:
            write_csv(args.csv_out, result['series'])
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
