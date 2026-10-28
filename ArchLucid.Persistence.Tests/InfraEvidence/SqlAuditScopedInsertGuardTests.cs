using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

public sealed class SqlAuditScopedInsertGuardTests
{
    [Fact]
    public async Task Architecture_link_rejects_foreign_tenant_before_opening_a_database_connection()
    {
        Guid tenant = Guid.NewGuid();
        ProjectScopeKey scope = ProjectScopeKey.Create(tenant, Guid.NewGuid(), Guid.NewGuid());
        // A null factory is intentional: rejecting mismatched authority must occur
        // before any SQL connection is attempted.
        SqlAuditManualEvidenceRepository repository = new(null!);
        AuditArchitectureEvidenceLinkRecord link = new()
        {
            LinkId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AssessmentId = Guid.NewGuid(),
            ControlId = Guid.NewGuid(),
            RequirementId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(),
            LinkedBy = "boundary-test",
            LinkedUtc = DateTime.UtcNow,
        };
        Func<Task> action = () => repository.InsertArchitectureLinkInScopeAsync(scope, link);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*foreign tenant authority*");
    }
}
