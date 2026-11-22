using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="PolicyPackChangeLogRepositoryContractTests" /> against
///     <see cref="InMemoryPolicyPackChangeLogRepository" />.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryPolicyPackChangeLogRepositoryContractTests : PolicyPackChangeLogRepositoryContractTests
{
    protected override IPolicyPackChangeLogRepository CreateRepository()
    {
        return new InMemoryPolicyPackChangeLogRepository();
    }

    [Fact]
    public async Task GetByPolicyPackId_filters_to_the_active_scope_when_a_scope_provider_is_available()
    {
        Guid policyPackId = Guid.NewGuid();
        ScopeContext activeScope = new()
        {
            TenantId = TenantA,
            WorkspaceId = WorkspaceW,
            ProjectId = ProjectP,
        };
        InMemoryPolicyPackChangeLogRepository repository =
            new(new FixedTestScopeContextProvider(activeScope));

        await repository.AppendAsync(CreateScopedEntry(policyPackId, activeScope, "in-scope"));
        await repository.AppendAsync(
            CreateScopedEntry(
                policyPackId,
                new ScopeContext
                {
                    TenantId = TenantB,
                    WorkspaceId = WorkspaceW,
                    ProjectId = ProjectP,
                },
                "foreign-tenant"));

        IReadOnlyList<PolicyPackChangeLogEntry> results =
            await repository.GetByPolicyPackIdAsync(policyPackId);

        results.Should().ContainSingle();
        results[0].SummaryText.Should().Be("in-scope");
    }

    private static PolicyPackChangeLogEntry CreateScopedEntry(
        Guid policyPackId,
        ScopeContext scope,
        string summary) =>
        new()
        {
            PolicyPackId = policyPackId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ChangeType = PolicyPackChangeTypes.Created,
            ChangedBy = "tester",
            ChangedUtc = new DateTime(2026, 11, 21, 0, 0, 0, DateTimeKind.Utc),
            SummaryText = summary,
        };
}
