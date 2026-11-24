#!/usr/bin/env python3
"""Pinned, oldest-first whole-source Aspects review planner and pass recorder.

The inventory is a *current-blob* coverage denominator, not a historical defect
rate. Legacy records remain intact; targeted reviews do not count toward
systematic-review completion. Runs locally against a full Git checkout.
"""
from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess

from aspects_review_evidence import SHA, normalize_path, parse_spans, read_records, record, verified_observation

SOURCE_SUFFIXES = frozenset({
    '.cs', '.csx', '.fs', '.fsx', '.py', '.js', '.jsx', '.mjs', '.cjs',
    '.ts', '.tsx', '.sql', '.ps1', '.sh', '.tf', '.go', '.rs', '.java',
    '.kt', '.c', '.h', '.cc', '.cpp', '.hpp', '.razor', '.vue', '.svelte',
    '.bicep', '.hcl', '.rego', '.proto', '.graphql', '.swift',
})
GENERATED_NAMES = re.compile(r'(?:\.g\.cs|\.designer\.cs|\.generated\.[cm]?[jt]sx?|\.min\.js)$', re.I)
EXCLUDED_DIRS = frozenset({
    'node_modules', '.next', 'bin', 'obj', 'dist', 'build', 'coverage',
    'coverage-report-core', 'coverage-report-full', 'coverage-report-merged',
    'coverage-report-final', '__pycache__', 'packages', '.venv', 'venv',
})
TEST_FILENAME = re.compile(r'(?:\.tests?\.[jt]sx?|\.spec\.[jt]sx?|Tests?\.cs|_test\.go|test_.*\.py)$', re.I)
TRACKS = ('systematic', 'targeted', 'architecture-reuse')
ARCH_STATUSES = ('compliant', 'gap', 'not-applicable', 'not-assessed')


def git(repo: Path, *args: str, input: bytes | None = None) -> bytes:
    if input is not None:
        command = subprocess.run(['git', '-C', str(repo), *args], input=input,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    else:
        command = subprocess.run(['git', '-C', str(repo), *args],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return command.stdout


def classify(path: str) -> str | None:
    """Return explicit review lane, or None for excluded config/fixture artifacts."""
    parts = Path(path).parts
    suffix = Path(path).suffix.lower()
    infrastructure_yaml = suffix in {'.yml', '.yaml'} and (parts[0] == 'infra' or parts[:2] == ('.github', 'workflows') or parts[:2] == ('.github', 'actions'))
    dockerfile = parts[-1] == 'Dockerfile' or parts[-1].startswith('Dockerfile.')
    if (any(part in EXCLUDED_DIRS for part in parts)
            or GENERATED_NAMES.search(path)
            or not (suffix in SOURCE_SUFFIXES or infrastructure_yaml or dockerfile)):
        return None
    if (any(part in {'tests', '__tests__', 'test'} or part.endswith('.Tests')
            for part in parts[:-1]) or TEST_FILENAME.search(parts[-1])):
        return 'test'
    if dockerfile or parts[0] in {'infra', 'terraform'} or suffix in {'.tf', '.sql', '.bicep', '.hcl', '.rego'}:
        return 'infrastructure'
    if parts[0] in {'scripts', 'tools', '.github'}:
        return 'tooling'
    return 'production'


def tree_sources(repo: Path, head: str) -> list[dict]:
    if not SHA.fullmatch(head):
        raise ValueError('Pin the source inventory to an exact 40-digit commit SHA')
    result = []
    for entry in git(repo, 'ls-tree', '-r', '-l', '-z', head).split(b'\0'):
        if not entry:
            continue
        metadata, delim, raw_path = entry.partition(b'\t')
        if not delim:
            raise ValueError('Malformed Git tree entry')
        mode, kind, blob, size = metadata.decode('ascii').split()
        path = raw_path.decode('utf-8')
        lane = classify(path)
        if lane is None or kind != 'blob' or mode == '120000':
            continue
        result.append({'path': path, 'blob': blob, 'lane': lane,
                       'git_blob_bytes': int(size)})
    return sorted(result, key=lambda item: item['path'])


def last_path_changes(repo: Path, head: str, tracked: set[str]) -> dict[str, dict]:
    """One Git history traversal for every eligible current path. Rename-aware
    first introduction is resolved separately only for files actually reviewed.
    """
    raw = git(repo, 'log', '-z', '--name-only', '--no-renames',
              '--format=@@ASPECTS:%H:%cI', head)
    latest = {}
    commit = None
    for raw_part in raw.split(b'\0'):
        if not raw_part:
            continue
        part = raw_part.decode('utf-8').lstrip('\n')
        if not part:
            continue
        if part.startswith('@@ASPECTS:'):
            sha, sep, date = part[len('@@ASPECTS:'):].partition(':')
            if not sep or not SHA.fullmatch(sha):
                raise ValueError('Malformed Git history commit marker')
            commit = {'sha': sha, 'utc': datetime.fromisoformat(date).astimezone(timezone.utc).isoformat()}
        elif part in tracked and part not in latest:
            if commit is None:
                raise ValueError('Git log source path preceded its commit metadata')
            latest[part] = commit.copy()
    if len(latest) != len(tracked):
        raise ValueError(f'Missing last-change Git history for {len(tracked) - len(latest)} source files')
    return latest


def earliest_git_history(repo: Path, head: str, path: str) -> dict:
    """Follow renames for one *reviewed* file, not every inventory candidate.
    Treat earliest reachable revision as first seen, not proven original creation.
    """
    path = normalize_path(path)
    history = git(repo, 'log', '--follow', '--format=%H%x09%cI', head, '--', path)
    rows = [row for row in history.decode('utf-8').splitlines() if row.strip()]
    parsed = []
    for row in rows:
        sha, sep, date = row.partition('\t')
        if sep and SHA.fullmatch(sha):
            parsed.append({'sha': sha, 'utc': datetime.fromisoformat(date).astimezone(timezone.utc).isoformat()})
    if not parsed:
        raise ValueError(f'No Git file history for {path} at {head}')
    shallow = git(repo, 'rev-parse', '--is-shallow-repository').strip() == b'true'
    return {'first_seen': parsed[-1], 'last_modified': parsed[0],
            'history_complete': not shallow,
            'first_seen_qualifier': ('earliest reachable --follow history, shallow checkout; actual introduction unknown'
                                     if shallow else 'earliest reachable --follow history; not proof of original creation')}


def nonblank_counts(repo: Path, blobs: list[str]) -> dict[str, int]:
    """Bound peak memory by reading Git blobs in small batches instead of
    materializing the entire multi-million-line codebase into one response.
    """
    unique = sorted(set(blobs))
    results = {}
    for offset in range(0, len(unique), 128):
        batch = unique[offset:offset + 128]
        response = git(repo, 'cat-file', '--batch',
                       input=('\n'.join(batch) + '\n').encode('ascii'))
        pos = 0
        for blob in batch:
            stop = response.index(b'\n', pos)
            header = response[pos:stop].decode('ascii')
            pieces = header.split(' ')
            if len(pieces) != 3 or pieces[0] != blob or pieces[1] != 'blob':
                raise ValueError('Unexpected Git batch blob response')
            size = int(pieces[2])
            start = stop + 1
            payload = response[start:start + size]
            if len(payload) != size or response[start + size:start + size + 1] != b'\n':
                raise ValueError('Truncated Git batch blob response')
            results[blob] = sum(bool(line.strip()) for line in payload.splitlines())
            pos = start + size + 1
        if pos != len(response):
            raise ValueError('Unexpected trailing Git batch output')
    return results


def eligible_records(files: list[dict], ledger: list[dict]) -> tuple[dict, dict]:
    """Two disjoint coverage tracks; only exact current blobs count.
    Repeated and stale observations never inflate current source coverage.
    """
    current = {item['path']: item for item in files}
    by_track = {'systematic': defaultdict(set), 'targeted': defaultdict(set),
                'architecture-reuse': defaultdict(set), 'known-verified': defaultdict(set)}
    observations = {'systematic': 0, 'systematic_clean': 0,
                    'systematic_defect': 0, 'targeted': 0, 'architecture-reuse': 0,
                    'architecture_compliant': 0, 'architecture_gaps': 0,
                    'architecture_not_assessed': 0, 'legacy_verified': 0}
    for row in ledger:
        if row.get('verified') is not True:
            continue
        path, blob, track = row.get('path'), row.get('blob'), row.get('review_track')
        if path not in current or current[path]['blob'] != blob:
            continue
        for lo, hi in parse_spans(row.get('spans', [])):
            by_track['known-verified'][path].update(range(lo, hi + 1))
        if track not in TRACKS:
            observations['legacy_verified'] += 1
            continue
        if track == 'systematic' and (row.get('review_outcome') not in {'clean', 'defect'}
                                      or not row.get('review_id')):
            continue
        lines = by_track[track][path]
        for lo, hi in parse_spans(row.get('spans', [])):
            if type(lo) is not int or type(hi) is not int or lo < 1 or hi < lo:
                raise ValueError(f'Invalid reviewed source span in {track} ledger')
            lines.update(range(lo, hi + 1))
        observations[track] += 1
        arch_status = row.get('architecture_reuse_status')
        if arch_status == 'compliant':
            observations['architecture_compliant'] += 1
        elif arch_status == 'gap':
            observations['architecture_gaps'] += 1
        else:
            observations['architecture_not_assessed'] += 1
        if track == 'systematic':
            observations['systematic_' + row['review_outcome']] += 1
    return by_track, observations


def build_inventory(repo: Path, head: str, ledger: list[dict], *, next_limit: int = 20,
                    review_id: str | None = None, lane: str | None = None) -> dict:
    if lane not in {None, 'production', 'test', 'tooling', 'infrastructure'}:
        raise ValueError('Unknown source review lane')
    files = tree_sources(repo, head)
    if lane is not None:
        files = [item for item in files if item['lane'] == lane]
    counts = nonblank_counts(repo, [item['blob'] for item in files])
    ages = last_path_changes(repo, head, {item['path'] for item in files})
    tracks, observations = eligible_records(files, ledger)
    lanes = {}
    queue = []
    for entry in files:
        path = entry['path']
        loc = counts[entry['blob']]
        systematic_lines = tracks['systematic'].get(path, set())
        targeted_lines = tracks['targeted'].get(path, set())
        known_lines = tracks['known-verified'].get(path, set())
        if len(systematic_lines) > loc or len(known_lines) > loc:
            raise ValueError(f'Systematic span count exceeds live source LOC: {path}')
        item = dict(entry, nonblank_loc=loc, last_path_change=ages[path],
                    systematic_reviewed_loc=len(systematic_lines),
                    targeted_reviewed_loc=len(targeted_lines),
                    known_verified_current_blob_loc=len(known_lines),
                    systematic_status=('complete' if loc == len(systematic_lines)
                                       else 'not-started' if not systematic_lines else 'partial'))
        entry.clear()
        entry.update(item)
        totals = lanes.setdefault(item['lane'], {'files': 0, 'nonblank_loc': 0,
                                                   'systematic_reviewed_loc': 0,
                                                   'partially_reviewed_files': 0,
                                                   'fully_reviewed_files': 0})
        totals['files'] += 1
        totals['nonblank_loc'] += loc
        totals['systematic_reviewed_loc'] += len(systematic_lines)
        totals['partially_reviewed_files'] += item['systematic_status'] == 'partial'
        totals['fully_reviewed_files'] += item['systematic_status'] == 'complete'
        if loc and item['systematic_status'] != 'complete':
            queue.append(item)
    queue.sort(key=lambda x: (x['systematic_reviewed_loc'] != 0,
                              x['known_verified_current_blob_loc'] != 0,
                              x['last_path_change']['utc'], x['path']))
    summary = {'head_sha': head, 'source_scope': ('tracked eligible code, excluding generated/vendor/non-source; '
                                + (f'{lane} lane only' if lane else 'all lanes displayed')),
               'coverage_provenance': 'exact current-blob verified systematic reviews only; not legacy workbook or historical cross-revision coverage',
               'lanes': lanes, 'observations': observations,
               'eligible_files': len(files),
               'eligible_nonblank_loc': sum(x['nonblank_loc'] for x in files),
               'systematic_reviewed_nonblank_loc': sum(x['systematic_reviewed_loc'] for x in files),
               'known_verified_current_blob_nonblank_loc': sum(x['known_verified_current_blob_loc'] for x in files)}
    summary['known_current_blob_subset_coverage_percent'] = (
        round(100 * summary['known_verified_current_blob_nonblank_loc'] / summary['eligible_nonblank_loc'], 4)
        if summary['eligible_nonblank_loc'] else None)
    summary['systematic_coverage_percent'] = round(100 * summary['systematic_reviewed_nonblank_loc'] /
                                                    summary['eligible_nonblank_loc'], 4) if summary['eligible_nonblank_loc'] else None
    passed = []
    if review_id:
        for row in ledger:
            if row.get('review_id') != review_id or row.get('verified') is not True:
                continue
            if row.get('path') not in {x['path'] for x in files}:
                continue
            # History must match the pre-repair baseline rather than any later fix commit.
            age = earliest_git_history(repo, row['baseline'], row['path'])
            modified = datetime.fromisoformat(age['last_modified']['utc'])
            passed.append({'path': row['path'], 'review_track': row.get('review_track'),
                           'review_outcome': row.get('review_outcome'),
                           'architectural_control': row.get('architectural_control'),
                           'architecture_reuse_status': row.get('architecture_reuse_status', 'not-assessed'),
                           'first_seen': age['first_seen'],
                           'last_modified_pre_review': age['last_modified'],
                           'days_since_last_change_as_of_report': max(0, (datetime.now(timezone.utc) - modified).days),
                           'first_seen_qualifier': age['first_seen_qualifier'],
                           'history_complete': age['history_complete']})
    passed.sort(key=lambda row: (row['first_seen']['utc'], row['path']))
    return {'summary': summary, 'files': files, 'next_review_candidates': queue[:next_limit],
            'review_id': review_id, 'reviewed_file_history': passed,
            'oldest_source_file_reviewed': passed[0] if passed else None}


def record_review(repo: Path, ledger_path: Path, baseline: str, path: str,
                  spans: list[str], review_id: str, track: str,
                  outcome: str, defect_id: str | None,
                  architecture_status: str, architectural_control: str | None, *,
                  finding_category: str | None = None, finding_severity: str | None = None,
                  review_notes: str | None = None) -> bool:
    if not review_id.strip() or track not in TRACKS or outcome not in {'clean', 'defect'}:
        raise ValueError('Explicit review ID, track, and clean/defect outcome required')
    if (outcome == 'clean') != (defect_id is None):
        raise ValueError('A clean review cannot claim a defect; defect review needs its stable ID')
    if architecture_status not in ARCH_STATUSES:
        raise ValueError('Invalid architectural reuse status')
    if classify(normalize_path(path)) is None:
        raise ValueError('Only eligible source code may count toward systematic coverage')
    row = verified_observation(repo, baseline, path, spans, defect_id)
    age = earliest_git_history(repo, baseline, path)
    row.update(review_id=review_id, review_track=track, review_outcome=outcome,
               architectural_control=architectural_control,
               architecture_reuse_status=architecture_status,
               source_first_seen=age['first_seen'],
               source_last_modified_before_review=age['last_modified'],
               first_seen_qualifier=age['first_seen_qualifier'],
               source_history_complete=age['history_complete'])
    if finding_category is not None:
        row['finding_category'] = finding_category
    if finding_severity is not None:
        row['finding_severity'] = finding_severity
    if review_notes is not None:
        row['review_notes'] = review_notes
    return record(ledger_path, row)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path('.'))
    parser.add_argument('--ledger', type=Path, default=Path('docs/engineering/aspects-review-ledger.jsonl'))
    commands = parser.add_subparsers(dest='command', required=True)
    plan = commands.add_parser('plan', help='Pinned systematic source coverage and oldest-first file queue')
    plan.add_argument('--head', required=True)
    plan.add_argument('--json-out', required=True, type=Path)
    plan.add_argument('--review-id')
    plan.add_argument('--next-limit', type=int, default=20)
    plan.add_argument('--csv-out', type=Path, help='Review age table for the historical workbook')
    reviewed = commands.add_parser('record', help='Record an actual, verified clean or defect review')
    reviewed.add_argument('--baseline', required=True)
    reviewed.add_argument('--path', required=True)
    reviewed.add_argument('--span', required=True, action='append')
    reviewed.add_argument('--review-id', required=True)
    reviewed.add_argument('--track', required=True, choices=TRACKS)
    reviewed.add_argument('--outcome', required=True, choices=('clean', 'defect'))
    reviewed.add_argument('--defect-id')
    reviewed.add_argument('--architecture-reuse-status', choices=ARCH_STATUSES, default='not-assessed')
    reviewed.add_argument('--architectural-control')
    args = parser.parse_args()
    if args.command == 'record':
        result = record_review(args.repo, args.ledger, args.baseline, args.path,
                               args.span, args.review_id, args.track, args.outcome,
                               args.defect_id, args.architecture_reuse_status,
                               args.architectural_control)
        print(json.dumps({'appended': result, 'review_id': args.review_id,
                          'review_track': args.track}))
        return
    if args.next_limit < 1:
        parser.error('--next-limit must be positive')
    result = build_inventory(args.repo, args.head, read_records(args.ledger),
                             next_limit=args.next_limit, review_id=args.review_id)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    if args.csv_out:
        args.csv_out.parent.mkdir(parents=True, exist_ok=True)
        with args.csv_out.open('w', newline='', encoding='utf-8') as handle:
            out = csv.writer(handle)
            out.writerow(['review_id', 'source_path', 'review_track', 'review_outcome',
                          'first_seen_utc', 'first_seen_sha', 'last_modified_pre_review_utc',
                          'last_modified_pre_review_sha', 'days_since_last_change_as_of_report',
                          'architectural_control', 'architecture_reuse_status', 'first_seen_qualifier'])
            for row in result['reviewed_file_history']:
                out.writerow([args.review_id, row['path'], row['review_track'], row['review_outcome'],
                              row['first_seen']['utc'], row['first_seen']['sha'],
                              row['last_modified_pre_review']['utc'], row['last_modified_pre_review']['sha'],
                              row['days_since_last_change_as_of_report'],
                              row['architectural_control'], row['architecture_reuse_status'],
                              row['first_seen_qualifier']])
    print(json.dumps({'summary': result['summary'],
                      'oldest_source_file_reviewed': result['oldest_source_file_reviewed'],
                      'next_review_candidates': result['next_review_candidates']}, indent=2))


if __name__ == '__main__':
    main()
