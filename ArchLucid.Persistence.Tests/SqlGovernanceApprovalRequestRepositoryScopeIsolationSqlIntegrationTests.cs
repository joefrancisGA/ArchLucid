using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tests.Contracts;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="IGovernanceApprovalRequestRepository.GetByIdAsync" /> scope isolation (TB-301).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlGovernanceApprovalRequestRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_approval_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        ScopeContext scopeA = GovernanceRepositoryContractScope.AsScopeContext();
        string runId = Guid.NewGuid().ToString("N");
        string approvalId = "apr-scope-iso-" + Guid.NewGuid().ToString("N");

        TenantPrimingGovernanceApprovalRequestRepository repositoryA = new(
            fixture.ConnectionString,
            new FixedTestScopeContextProvider(scopeA));

        GovernanceApprovalRequest approval = new()
        {
            ApprovalRequestId = approvalId,
            RunId = runId,
            TenantId = scopeA.TenantId,
            WorkspaceId = scopeA.WorkspaceId,
            ProjectId = scopeA.ProjectId,
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test,
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
            RequestedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await repositoryA.CreateAsync(approval, CancellationToken.None);

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scopeA.WorkspaceId,
            ProjectId = scopeA.ProjectId,
        };

        TenantPrimingGovernanceApprovalRequestRepository repositoryB = new(
            fixture.ConnectionString,
            new FixedTestScopeContextProvider(scopeB));

        GovernanceApprovalRequest? leaked = await repositoryB.GetByIdAsync(approvalId, CancellationToken.None);

        leaked.Should().BeNull("governance approval reads must not resolve under a different tenant scope.");

        GovernanceApprovalRequest? owned = await repositoryA.GetByIdAsync(approvalId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
