using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Governance;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="PolicyPackAssignmentRepositoryContractTests" /> against
///     <see cref="DapperPolicyPackAssignmentRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperPolicyPackAssignmentRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : PolicyPackAssignmentRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IPolicyPackAssignmentRepository CreateRepository()
    {
        SqlConnectionFactory sql = new(fixture.ConnectionString);
        SqlPrimaryMirroredReadReplicaConnectionFactory readMirror = new(sql);
        return new DapperPolicyPackAssignmentRepository(sql, readMirror,
            NullLogger<DapperPolicyPackAssignmentRepository>.Instance);
    }

    protected override async Task EnsurePolicyPackRowAsync(
        PolicyPackAssignment assignment,
        CancellationToken cancellationToken)
    {
        SqlConnectionFactory sql = new(fixture.ConnectionString);
        SqlPrimaryMirroredReadReplicaConnectionFactory readMirror = new(sql);
        DapperPolicyPackRepository packRepository = new(sql, readMirror);

        PolicyPack? existing = await packRepository.GetByIdAsync(assignment.PolicyPackId, cancellationToken);

        if (existing is not null)
            return;

        PolicyPack pack = new()
        {
            PolicyPackId = assignment.PolicyPackId,
            TenantId = assignment.TenantId,
            WorkspaceId = assignment.WorkspaceId,
            ProjectId = assignment.ProjectId,
            Name = "contract-seed-pack",
            Description = "Policy pack assignment contract test seed",
            PackType = PolicyPackType.BuiltIn,
            Status = PolicyPackStatus.Draft,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentVersion = assignment.PolicyPackVersion,
        };

        await packRepository.CreateAsync(pack, cancellationToken);
    }
}
