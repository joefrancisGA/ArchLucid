using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Tests;

/// <summary>Deterministic scope ids shared by governance repository contract tests.</summary>
public static class GovernanceRepositoryContractScope
{
    public static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee");

    public static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-dddd-eeee-ffffffffffff");

    public static ScopeContext AsScopeContext() => new()
    {
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectId
    };
}
