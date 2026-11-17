using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuditAssessmentScopedUpdateFallbackTests
{
    [Fact]
    public void Scoped_status_mutation_must_not_use_tenant_only_update_after_a_precheck()
    {
        LegacyAssessments legacy = new();
        IAuditAssessmentRepository repository = legacy;
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        foreach (ProjectScopeKey scope in new[]
        {
            ProjectScopeKey.Create(tenant, workspace, project),
            ProjectScopeKey.Create(tenant, workspace, Guid.NewGuid()),
            ProjectScopeKey.Create(tenant, Guid.NewGuid(), project),
            ProjectScopeKey.Create(Guid.NewGuid(), workspace, project),
        })
        {
            Action action = () => _ = repository.UpdateStatusInScopeAsync(
                scope, new AuditAssessmentStatusMutation
                {
                    AssessmentId = Guid.NewGuid(),
                    Status = AuditAssessmentStatus.Archived,
                });
            action.Should().Throw<NotSupportedException>().WithMessage("*atomic scoped repository implementation*");
        }
        legacy.PrecheckCalls.Should().Be(0);
        legacy.TenantOnlyWrites.Should().Be(0);
    }

    private sealed class LegacyAssessments : IAuditAssessmentRepository
    {
        public int PrecheckCalls { get; private set; }
        public int TenantOnlyWrites { get; private set; }
        public Task InsertAsync(AuditAssessmentRecord item, CancellationToken token = default)
            => Task.CompletedTask;
        public Task<AuditAssessmentRecord?> TryGetByIdAsync(Guid tenantId, Guid id, CancellationToken token = default)
        {
            PrecheckCalls++;
            return Task.FromResult<AuditAssessmentRecord?>(null);
        }
        public Task UpdateStatusAsync(Guid tenantId, Guid id, AuditAssessmentStatus status,
            CancellationToken token = default)
        {
            TenantOnlyWrites++;
            return Task.CompletedTask;
        }
        public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(Guid tenantId, CancellationToken token = default)
            => Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>([]);
    }
}
