# Fix: CI run #2179 — pre-corset guard `MARKER_MISMATCH` (audit const count 268 vs 270)

**Run:** 27486770797 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Commit:** `b7bf442d12e0a49c587758bf1104ad7bf77a2ff4`  
**Job:** `CI: guards pre-corset (text)` (databaseId `81244904753`)

## Symptom

```
Pre-corset guards: ARCHLUCID_GIT_DIFF_RANGE=origin/master...HEAD
::error::MARKER_MISMATCH: marker=268 source_const_count=270
assert_audit_const_count: FAILED
Process completed with exit code 1.
```

`scripts/ci/assert_audit_const_count.py` found:

- `<!-- audit-core-const-count:268 -->` in `docs/library/AUDIT_COVERAGE_MATRIX.md`
- `270` `public const string` entries in `ArchLucid.Core/Audit/AuditEventTypes.cs`

**2 new constants were added to `AuditEventTypes.cs` without updating the matrix.**

## Fix

### Step 1 — identify the 2 new constants

The current working tree already has 270 constants in `AuditEventTypes.cs` and the matrix marker
is locally at 270 (the fix is partially in progress). Confirm which 2 constants are new by checking
the `docs/library/AUDIT_COVERAGE_MATRIX.md` appendices against the source:

```powershell
python scripts/ci/assert_audit_const_count.py
```

If the script reports `MISSING_IN_MATRIX`, it will name the missing keys. If it exits 0, the fix is
already applied locally and only needs to be committed.

### Step 2 — add the 2 missing rows to the correct appendix

Locate the appropriate appendix section in `docs/library/AUDIT_COVERAGE_MATRIX.md`:

- `## Appendix — Core` for top-level constants
- `## Appendix — AuditEventTypes.Run` for `Run.*` constants
- `## Appendix — AuditEventTypes.Baseline` for `Baseline.Architecture.*` / `Baseline.Governance.*` constants

Add a table row for each missing constant following the established format. The script reads the
first backtick-wrapped cell in each row (`| \`ConstantName\` |`), so match the existing row style.

### Step 3 — update the marker

Change `<!-- audit-core-const-count:268 -->` to `<!-- audit-core-const-count:270 -->` at line 18 of
`docs/library/AUDIT_COVERAGE_MATRIX.md`. If the local working tree already shows 270, verify the
appendix rows are also present, then commit everything together.

## Acceptance criteria

1. `python scripts/ci/assert_audit_const_count.py` exits 0 from the repo root.
2. `<!-- audit-core-const-count:270 -->` marker in `AUDIT_COVERAGE_MATRIX.md`.
3. 270 `public const string` entries in `AuditEventTypes.cs` with matching appendix rows.
4. No product or logic changes — matrix + marker alignment only.

## Verification

```powershell
python scripts/ci/assert_audit_const_count.py
```

## Related

- `scripts/ci/assert_audit_const_count.py`
- `docs/library/AUDIT_COVERAGE_MATRIX.md`
- `ArchLucid.Core/Audit/AuditEventTypes.cs`
- Pre-corset guard script: `scripts/ci/run_guards_pre_corset.sh`
