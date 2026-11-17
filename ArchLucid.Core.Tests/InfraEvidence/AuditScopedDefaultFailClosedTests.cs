using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuditScopedDefaultFailClosedTests
{
    [Fact]
    public void Snapshot_scoped_defaults_never_delegate_to_tenant_only_storage()
    {
        TenantOnlySnapshots implementation = new();
        IAuditEvidenceSnapshotRepository repository = implementation;
        foreach (ProjectScopeKey scope in Scopes())
        {
            Guid id = Guid.NewGuid();
            Action[] operations =
            [
                () => _ = repository.InsertSnapshotInScopeAsync(scope, new AuditEvidenceSnapshotPersistRequest()),
                () => _ = repository.TryGetHeaderInScopeAsync(scope, id),
                () => _ = repository.ListItemsInScopeAsync(scope, id),
                () => _ = repository.ListByAssessmentInScopeAsync(scope, id),
                () => _ = repository.InsertBaselineInScopeAsync(scope, new AuditEvidenceBaselineRecord()),
                () => _ = repository.TryGetBaselineByNameInScopeAsync(scope, id, "baseline"),
                () => _ = repository.UpdateItemFreshnessInScopeAsync(scope, id, []),
            ];
            foreach (Action operation in operations)
                operation.Should().Throw<NotSupportedException>();
        }
        implementation.TenantOnlyCalls.Should().Be(0);
    }

    [Fact]
    public void Control_evaluation_scoped_defaults_never_delegate_to_tenant_only_storage()
    {
        TenantOnlyEvaluations implementation = new();
        IAuditControlEvaluationRepository repository = implementation;
        foreach (ProjectScopeKey scope in Scopes())
        {
            Guid id = Guid.NewGuid();
            Action[] operations =
            [
                () => _ = repository.InsertInScopeAsync(scope, new AuditControlEvaluationPersistRequest()),
                () => _ = repository.TryGetLatestByControlInScopeAsync(scope, id, Guid.NewGuid()),
                () => _ = repository.ListEvidenceItemsByEvaluationInScopeAsync(scope, id),
            ];
            foreach (Action operation in operations)
                operation.Should().Throw<NotSupportedException>();
        }
        implementation.TenantOnlyCalls.Should().Be(0);
    }

    private static IEnumerable<ProjectScopeKey> Scopes()
    {
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        yield return ProjectScopeKey.Create(tenant, workspace, project);
        yield return ProjectScopeKey.Create(tenant, workspace, Guid.NewGuid());
        yield return ProjectScopeKey.Create(tenant, Guid.NewGuid(), project);
        yield return ProjectScopeKey.Create(Guid.NewGuid(), workspace, project);
    }

    private sealed class TenantOnlySnapshots : IAuditEvidenceSnapshotRepository
    {
        public int TenantOnlyCalls { get; private set; }
        public Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.CompletedTask; }
        public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(Guid tenantId, Guid id, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<AuditEvidenceSnapshotHeaderRecord?>(null); }
        public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(Guid tenantId, Guid id, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>([]); }
        public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(Guid tenantId, Guid id, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>>([]); }
        public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.CompletedTask; }
        public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(Guid tenantId, Guid id, string name, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<AuditEvidenceBaselineRecord?>(null); }
        public Task UpdateItemFreshnessAsync(Guid tenantId, Guid id, IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.CompletedTask; }
        public Task<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>> ListLineageContextsByCloudResourceIdAsync(Guid tenantId, Guid cloudResourceId, int take, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>>([]); }
    }

    private sealed class TenantOnlyEvaluations : IAuditControlEvaluationRepository
    {
        public int TenantOnlyCalls { get; private set; }
        public Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.CompletedTask; }
        public Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(Guid tenantId, Guid controlId, Guid snapshotId, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<AuditControlEvaluationRecord?>(null); }
        public Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(Guid tenantId, Guid evaluationId, CancellationToken cancellationToken = default)
        { TenantOnlyCalls++; return Task.FromResult<IReadOnlyList<AuditEvidenceItemRecord>>([]); }
    }
}
