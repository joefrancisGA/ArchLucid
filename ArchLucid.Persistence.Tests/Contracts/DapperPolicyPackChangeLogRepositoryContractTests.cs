using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="PolicyPackChangeLogRepositoryContractTests" /> against
///     <see cref="DapperPolicyPackChangeLogRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperPolicyPackChangeLogRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : PolicyPackChangeLogRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IPolicyPackChangeLogRepository CreateRepository()
    {
        SqlConnectionFactory sql = new(fixture.ConnectionString);
        SqlPrimaryMirroredReadReplicaConnectionFactory readMirror = new(sql);

        return new DapperPolicyPackChangeLogRepository(sql, readMirror);
    }

    protected override async Task EnsurePolicyPackRowAsync(
        Guid policyPackId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        SqlConnectionFactory sql = new(fixture.ConnectionString);
        SqlPrimaryMirroredReadReplicaConnectionFactory readMirror = new(sql);
        DapperPolicyPackRepository packRepository = new(sql, readMirror);

        PolicyPack? existing = await packRepository.GetByIdAsync(policyPackId, cancellationToken);

        if (existing is not null)
            return;

        PolicyPack pack = new()
        {
            PolicyPackId = policyPackId,
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1"),
            ProjectId = Guid.Parse("c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1"),
            Name = "contract-seed-pack",
            Description = "Policy pack change-log contract test seed",
            PackType = PolicyPackType.BuiltIn,
            Status = PolicyPackStatus.Draft,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentVersion = "1",
        };

        await packRepository.CreateAsync(pack, cancellationToken);
    }
}
