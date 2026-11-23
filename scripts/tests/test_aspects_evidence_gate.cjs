'use strict';

// Exercise the exact GitHub-script gate without checking out/executing PR code
// in that gate. No third-party YAML parser or GitHub credentials are required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const workflow = fs.readFileSync(path.resolve(__dirname,
  '../../.github/workflows/aspects-evidence-gate.yml'), 'utf8');
const marker = '          script: |\n';
assert.equal(workflow.split(marker).length, 2, 'expected one inline evidence-gate script');
const script = workflow.split(marker)[1].split('\n')
  .filter(line => line.startsWith('            '))
  .map(line => line.slice(12)).join('\n');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const evaluateGate = new AsyncFunction('context', 'github', 'core', script);

const ledgerPath = 'docs/engineering/aspects-review-ledger.jsonl';
const productPath = 'ArchLucid.Api/Controllers/ExampleController.cs';
const changed = (filename, status = 'modified', additions = 1, extra = {}) =>
  ({ filename, status, additions, ...extra });

async function decision(files, overrides = {}) {
  const errors = [], messages = [];
  const listFiles = Symbol('listFiles');
  const context = {
    repo: { owner: 'joefrancisGA', repo: 'ArchLucid' },
    payload: { pull_request: {
      number: 7822, head: { ref: 'aspects/historical-multisource-pins-20261122' },
      created_at: '2026-11-22T22:46:07Z', ...overrides,
    } },
  };
  await evaluateGate(context, {
    rest: { pulls: { listFiles } },
    paginate: async (method, options) => {
      assert.equal(method, listFiles);
      assert.equal(options.pull_number, 7822);
      assert.equal(options.per_page, 100);
      return files;
    },
  }, { info: text => messages.push(text), setFailed: text => errors.push(text) });
  return { errors, messages };
}

test('full historical restoration change set needs accounting validation, not invented product review', async () => {
  // Historical restoration paths, including the merged concurrent accounting work.
  const files = [
    '.github/workflows/aspects-density-snapshot.yml',
    '.github/workflows/aspects-evidence-gate.yml',
    'docs/engineering/aspects-historical-restoration-state.json',
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-git-pin-45074611128.json',
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-github-multisource-34.json',
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-900-pin-partition.json',
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-23-row908-utf8-bom.json',
    'docs/engineering/aspects-historical/fix-pr-state-checkpoints/2026-11-22-nine-merged.json',
    'docs/engineering/aspects-historical/fix-pr-state-checkpoints/2026-11-22-duplicate-6702-of-6701.json',
    'docs/engineering/aspects-historical/fix-pr-state-checkpoints/2026-11-23-all-referenced.json',
    'scripts/aspects_density_snapshot.py',
    'scripts/tests/test_aspects_density_snapshot.py',
    'scripts/tests/test_aspects_evidence_gate.cjs',
    'scripts/aspects_reconcile_historical_defect_ids.py',
    'scripts/aspects_verify_duplicate_fix_relationship.py',
    'scripts/tests/test_aspects_verify_duplicate_fix_relationship.py',
    'scripts/aspects_reconcile_historical_lineage.py',
    'scripts/aspects_reconcile_recovered_candidates.py',
    'scripts/aspects_recover_unpinned_historical_sources.py',
    'scripts/aspects_validate_historical_pins.py',
    'scripts/tests/test_aspects_historical_multisource_checkpoint.py',
    'scripts/tests/test_aspects_reconcile_historical_defect_ids.py',
    'scripts/tests/test_aspects_reconcile_historical_lineage.py',
    'scripts/tests/test_aspects_reconcile_recovered_candidates.py',
    'scripts/tests/test_aspects_recover_unpinned_historical_sources.py',
    'scripts/tests/test_aspects_validate_historical_pins.py',
  ];
  const result = await decision(files.map(name => changed(name)));
  assert.deepEqual(result.errors, []);
  assert.ok(result.messages.some(message => message.startsWith('Accounting-only migration:')));
});

test('existing corpus, 600/700 series and gate regression updates stay in the accounting scope', async () => {
  const result = await decision([
    'docs/engineering/aspects-historical/review-events/0007-0256.jsonl',
    'docs/engineering/aspects-historical/aspects-historical-900-snapshots.jsonl',
    'docs/engineering/aspects-historical/aspects-provisional-600-series.jsonl',
    'docs/engineering/aspects-historical/aspects-provisional-700-series.jsonl',
    'scripts/tests/test_aspects_evidence_gate.cjs',
    '.github/workflows/aspects-evidence-gate.yml',
  ].map(name => changed(name)));
  assert.deepEqual(result.errors, []);
});

test('adding product source to an accounting PR still requires recorded review evidence', async () => {
  const result = await decision([
    changed('scripts/aspects_validate_historical_pins.py'), changed(productPath),
  ]);
  assert.equal(result.errors.length, 1);
});

test('zero-defect review additions satisfy the source gate without inventing a defect', async () => {
  const result = await decision([changed(productPath), changed(ledgerPath, 'modified', 1)]);
  assert.deepEqual(result.errors, []);
  assert.ok(result.messages.some(message => message.includes('source/blob verification')));
});

test('arbitrary accounting-looking scripts and workflow changes do not earn an exception', async () => {
  for (const name of [
    'scripts/aspects_unreviewed.py',
    'scripts/tests/test_aspects_unreviewed.py',
    '.github/workflows/ci.yml',
    'scripts/aspects_reconcile_historical_lineage.py/../../product.py',
  ]) {
    assert.equal((await decision([changed(name)])).errors.length, 1, name);
  }
});

test('checkpoint exception permits only explicitly enumerated restoration evidence files', async () => {
  for (const name of [
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-900-pin-partition.json',
    'docs/engineering/aspects-historical/fix-pr-state-checkpoints/2026-11-23-all-referenced.json',
  ]) {
    assert.deepEqual((await decision([changed(name, 'added')])).errors, [], name);
  }
  for (const name of [
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-unreviewed.json',
    'docs/engineering/aspects-historical/fix-pr-state-checkpoints/2026-11-23-unknown.json',
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-review.py',
    'docs/engineering/aspects-historical/audit-checkpoints/undated.json',
    'docs/engineering/aspects-historical/audit-checkpoints/2026-11-22-review.json/extra.py',
    'docs/engineering/aspects-historical/audit-checkpoints/../2026-11-22-review.json',
    'docs/engineering/aspects-historical/other/2026-11-22-review.json',
  ]) {
    assert.equal((await decision([changed(name)])).errors.length, 1, name);
  }
});

test('renaming product source into an allowed accounting path still requires evidence', async () => {
  const file = changed('scripts/aspects_validate_historical_pins.py', 'renamed', 1,
    { previous_filename: productPath });
  assert.equal((await decision([file])).errors.length, 1);
});

test('renames require both old and new paths to remain in the accounting scope', async () => {
  const oldPath = 'scripts/aspects_validate_historical_pins.py';
  const newPath = 'scripts/aspects_reconcile_historical_lineage.py';
  assert.deepEqual((await decision([changed(newPath, 'renamed', 1,
    { previous_filename: oldPath })])).errors, []);
  assert.equal((await decision([changed(productPath, 'renamed', 1,
    { previous_filename: oldPath })])).errors.length, 1);
  assert.equal((await decision([changed(newPath, 'renamed')])).errors.length, 1);
});

test('empty and malformed file inventories fail closed', async () => {
  for (const files of [[], [{}], [{ filename: 'scripts/aspects_validate_historical_pins.py' }],
    [changed('scripts/aspects_validate_historical_pins.py', 'unknown')]]) {
    assert.equal((await decision(files)).errors.length, 1);
  }
});

test('removed or empty ledger changes cannot substitute for review evidence', async () => {
  for (const file of [changed(ledgerPath, 'removed', 5), changed(ledgerPath, 'modified', 0),
    changed(ledgerPath, 'renamed', 5), { filename: ledgerPath, status: 'modified' },
    changed(ledgerPath, 'modified', '1'), changed(ledgerPath, 'modified', -1)]) {
    assert.equal((await decision([changed(productPath), file])).errors.length, 1);
  }
});

test('existing non-Aspects and pre-enforcement behavior is preserved', async () => {
  assert.deepEqual((await decision([changed(productPath)], { head: { ref: 'fix/ordinary' } })).errors, []);
  assert.deepEqual((await decision([changed(productPath)], { created_at: '2026-11-22T16:59:59Z' })).errors, []);
});
