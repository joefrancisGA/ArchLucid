# Pre-commit governance gate (optional)

## Objective

Give governance teams a **preventive** control: block **`POST /v1/architecture/run/{runId}/commit`** when **Critical** findings exist and an assigned policy pack **enforces** the gate.

## Configuration

| Key | Default | Effect |
|-----|---------|--------|
| **`ArchLucid:Governance:PreCommitGateEnabled`** | **false** | When **false**, the gate is **not evaluated** (no findings or assignment load on the commit path beyond existing behavior). |

## Policy assignment

SQL migration **`054_PolicyPackAssignments_BlockCommitOnCritical.sql`** adds **`BlockCommitOnCritical`** (**bit**, default **0**) to **`dbo.PolicyPackAssignments`**.

- When **`IsEnabled`** and **`BlockCommitOnCritical`** are **true** for an assignment in scope for the run’s tenant/workspace/project, the gate **may** block commit.
- Assignments are evaluated using the same hierarchical listing as other governance features (**`IPolicyPackAssignmentRepository.ListByScopeAsync`**).

## Enforcement logic

1. Resolve the **run** and its **`FindingsSnapshotId`**.
2. Load **`FindingsSnapshot`**; collect findings with **`FindingSeverity.Critical`**.
3. If **no** enforcing assignment or **no** critical findings → commit proceeds.
4. If **both** → **`409`** **`#governance-pre-commit-blocked`** and durable audit **`GovernancePreCommitBlocked`** (see **`docs/AUDIT_COVERAGE_MATRIX.md`**).

## API surface

Problem details **`type`**: **`https://archlucid.example.org/errors#governance-pre-commit-blocked`**. Extensions: **`blockingFindingIds`** (array of strings), optional **`policyPackId`**. **`correlationId`** follows normal **`ProblemCorrelation`** attachment.

## Trade-offs

| Benefit | Cost |
|---------|------|
| Stops non-compliant golden manifests before they land | May **block** teams until critical findings are resolved or policy is adjusted |
| Clear audit trail | Operators must understand **Critical** vs **Error** severity semantics in findings |

## Related

- **`docs/API_CONTRACTS.md`** — commit conflict vs governance block.
- **`docs/V1_SCOPE.md`** §2.10 — optional feature flagging.
