using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class NoOpAuditScopeBehaviorTests
{
    [Fact]
    public async Task No_op_snapshot_repository_explicit_scoped_methods_are_inert()
    {
        IAuditEvidenceSnapshotRepository repository = new NoOpAuditEvidenceSnapshotRepository();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid assessmentId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        // The intentionally disabled implementation must remain safe and empty for all
        // seven project-scoped operations after interface defaults become fail-closed.
        await repository.InsertSnapshotInScopeAsync(scope, new AuditEvidenceSnapshotPersistRequest());
        (await repository.TryGetHeaderInScopeAsync(scope, snapshotId)).Should().BeNull();
        (await repository.ListItemsInScopeAsync(scope, snapshotId)).Should().BeEmpty();
        (await repository.ListByAssessmentInScopeAsync(scope, assessmentId)).Should().BeEmpty();
        await repository.InsertBaselineInScopeAsync(scope, new AuditEvidenceBaselineRecord());
        (await repository.TryGetBaselineByNameInScopeAsync(scope, assessmentId, "missing")).Should().BeNull();
        await repository.UpdateItemFreshnessInScopeAsync(scope, snapshotId, []);
    }

    [Fact]
    public async Task No_op_evaluation_repository_explicit_scoped_methods_are_inert()
    {
        IAuditControlEvaluationRepository repository = new NoOpAuditControlEvaluationRepository();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        await repository.InsertInScopeAsync(scope, new AuditControlEvaluationPersistRequest());
        (await repository.TryGetLatestByControlInScopeAsync(scope, Guid.NewGuid(), Guid.NewGuid())).Should().BeNull();
        (await repository.ListEvidenceItemsByEvaluationInScopeAsync(scope, Guid.NewGuid())).Should().BeEmpty();
    }
}
