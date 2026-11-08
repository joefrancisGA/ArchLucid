#!/usr/bin/env python3
"""Reconcile production question exports against offline native ZIP replay.

Strictly local, read-only inputs; writes only --out. No Azure, SQL or services.
Never marks a security claim or human question resolved.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

SCHEMA = 'securenow.evidence-lab.reconciliation.v1'
SUB_PATTERN = re.compile(r'[a-z0-9_-]{1,80}\Z')
SHA_PATTERN = re.compile(r'[0-9a-f]{64}\Z')


def normalize(value: object) -> str:
    return str(value or '').strip().lower()


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding='utf-8'))


def read_export(question_dir: Path | None, sub: str) -> list[dict] | None:
    if question_dir is None:
        return None
    existing = [p for p in (question_dir / f'{sub}.questions.json',
                              question_dir / f'{sub}.json') if p.is_file()]
    if not existing:
        return None
    if len(existing) != 1:
        raise ValueError(f'Ambiguous question export for subscription {sub}')
    data = read_json(existing[0])
    if isinstance(data, dict):
        data = data.get('questions')
    if not isinstance(data, list) or any(not isinstance(q, dict) for q in data):
        raise ValueError(f'Question export must be an array: {sub}')
    snapshots = set()
    for q in data:
        if normalize(q.get('subscriptionId')) != sub:
            raise ValueError(f'Cross-subscription question in export for {sub}')
        snapshot = normalize(q.get('snapshotId'))
        if not snapshot:
            raise ValueError(f'Exported question lacks snapshotId for {sub}')
        snapshots.add(snapshot)
    if len(snapshots) > 1:
        raise ValueError(f'Exported question snapshot mismatch for {sub}')
    return data


def read_native(native_dir: Path | None, sub: str, package_sha: str) -> dict | None:
    if native_dir is None:
        return None
    files = [p for p in (native_dir / f'{sub}.native.json', native_dir / f'{sub}.json')
             if p.is_file()]
    if not files:
        return None
    if len(files) > 1:
        raise ValueError(f'Ambiguous native replay for {sub}')
    data = read_json(files[0])
    if not isinstance(data, dict):
        raise ValueError(f'Invalid native replay object: {sub}')
    if (data.get('schema') != 'securenow.offline-native-questions.v1'
            or data.get('status') != 'PARTIAL_QUESTION_REPLAY'):
        raise ValueError(f'Native report is not a validated partial replay: {sub}')
    if normalize(data.get('subscriptionId')) != sub:
        raise ValueError(f'Native replay subscription differs from evidence package: {sub}')
    sha = normalize(data.get('packageSha256'))
    if not SHA_PATTERN.fullmatch(sha) or sha != package_sha:
        raise ValueError(f'Native replay package SHA-256 mismatch: {sub}')
    questions = data.get('questions')
    if not isinstance(questions, list) or any(not isinstance(q, dict) for q in questions):
        raise ValueError(f'Native questions malformed: {sub}')
    if type(data.get('questionCount')) is not int or data['questionCount'] != len(questions):
        raise ValueError(f'Native question count mismatch: {sub}')
    return data


def identity(question: dict, native: bool) -> tuple[str, str, str]:
    source = normalize(question.get('source'))
    key = normalize(question.get('questionKey'))
    if not key or not source:
        raise ValueError('Question lacks source or versioned questionKey')
    if native:
        resource_sha = normalize(question.get('resourceSha256'))
        if not SHA_PATTERN.fullmatch(resource_sha):
            raise ValueError('Native question is missing a valid resource SHA-256')
    else:
        resource = normalize(question.get('resourceId'))
        resource_sha = hashlib.sha256(resource.encode('utf-8')).hexdigest()
    return source, key, resource_sha


def question_index(questions: list[dict], native: bool) -> dict[tuple[str,str,str],str]:
    index = {}
    for question in questions:
        key = identity(question, native)
        if key in index:
            raise ValueError('Duplicate normalized question identity in same snapshot')
        index[key] = normalize(question.get('evidenceFingerprint'))
    return index


def row(key: tuple[str,str,str], issue: str) -> dict:
    return {
        'source': key[0], 'questionKey': key[1], 'resourceSha256': key[2],
        'difference': issue,
    }


def compare(evidence_report: dict, native_dir: Path | None,
            question_dir: Path | None) -> dict:
    if (not isinstance(evidence_report, dict)
            or evidence_report.get('schema') != 'securenow.evidence-lab.v1'):
        raise ValueError('Expected V1 evidence coverage report schema')
    packages = evidence_report.get('subscriptions')
    if not isinstance(packages, list):
        raise ValueError('Evidence report missing subscription list')
    results = []
    seen = set()
    for package in sorted(packages, key=lambda p: normalize(p.get('subscriptionId'))):
        if not isinstance(package, dict):
            raise ValueError('Invalid subscription entry')
        sub = normalize(package.get('subscriptionId'))
        if not SUB_PATTERN.fullmatch(sub) or sub in seen:
            raise ValueError(f'Invalid or duplicate subscription id: {sub}')
        seen.add(sub)
        package_sha = normalize(package.get('packageSha256'))
        if not SHA_PATTERN.fullmatch(package_sha):
            raise ValueError(f'Missing authentic package hash for {sub}')
        native = read_native(native_dir, sub, package_sha)
        exported = read_export(question_dir, sub)
        if exported is not None:
            if package.get('questionQueueStatus') != 'Provided':
                raise ValueError(f'Evidence audit did not pin a question export: {sub}')
            if package.get('questionCount') != len(exported):
                raise ValueError(f'Evidence audit question export count changed: {sub}')
        if native is None or exported is None:
            results.append({
                'subscriptionId': sub, 'packageSha256': package_sha,
                'state': 'NOT_COMPARABLE',
                'nativePresent': native is not None,
                'exportPresent': exported is not None,
                'questionSourceSnapshotVerified': False,
                'differences': [],
            })
            continue
        # Compare only the source actually generated by the native replay. The
        # production API may include unrelated policy-pack and inference questions.
        native_index = question_index(native['questions'], native=True)
        if any(key[0] != 'inventoryevidence' for key in native_index):
            raise ValueError(f'Native replay claims a source it did not execute: {sub}')
        actual_index = question_index(exported, native=False)
        actual_inventory = {key: fp for key, fp in actual_index.items()
                            if key[0] == 'inventoryevidence'}
        missing = sorted(set(native_index) - set(actual_inventory))
        additional = sorted(set(actual_inventory) - set(native_index))
        mismatch = sorted(key for key in set(native_index) & set(actual_inventory)
                          if native_index[key] != actual_inventory[key])
        matches = len(set(native_index) & set(actual_inventory)) - len(mismatch)
        differences = ([row(key, 'nativeOnly') for key in missing]
                       + [row(key, 'apiOnly') for key in additional]
                       + [row(key, 'fingerprintDrift') for key in mismatch])
        differences.sort(key=lambda x: (x['difference'], x['questionKey'], x['resourceSha256']))
        results.append({
            'subscriptionId': sub, 'packageSha256': package_sha,
            'state': 'MATCHED_PARTIAL_SLICE' if not differences else 'REVIEW_REQUIRED',
            'nativePresent': True, 'exportPresent': True,
            'questionSourceSnapshotVerified': False,
            'nativeInventoryQuestions': len(native_index),
            'exportedInventoryQuestions': len(actual_inventory),
            'exportedOtherQuestions': len(actual_index) - len(actual_inventory),
            'matchedQuestions': matches,
            'nativeOnly': len(missing), 'apiOnly': len(additional),
            'fingerprintDrift': len(mismatch),
            'differences': differences,
        })
    return {
        'schema': SCHEMA,
        'status': 'PARTIAL_REPLAY_COMPARISON',
        'scope': 'inventory-question-slice-only',
        'limitations': [
            'Not a security finding clearance, full policy-pack run, or complete path replay.',
            'Exported question snapshot authenticity is NOT verified by this offline file comparison.',
            'Matching question fingerprints do not demonstrate absence of missing Azure evidence.',
            'No questions are answered, suppressed, or marked risk accepted.',
            'No SQL/Azure/AI/network or production data mutation occurs.',
        ],
        'notCollectedSubscriptions': evidence_report.get('notCollectedSubscriptions'),
        'subscriptions': results,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--coverage-report', type=Path, required=True)
    p.add_argument('--native-dir', type=Path, required=True)
    p.add_argument('--questions-dir', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--fail-on-drift', action='store_true')
    args = p.parse_args(argv)
    try:
        report = compare(read_json(args.coverage_report), args.native_dir, args.questions_dir)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n', encoding='utf-8')
        if args.fail_on_drift and any(item['state'] != 'MATCHED_PARTIAL_SLICE'
                                      for item in report['subscriptions']):
            return 3
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f'SecureNow replay reconciliation: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
