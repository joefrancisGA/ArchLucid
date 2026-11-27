using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Configuration;

/// <summary>Independent free-edition rollout grants. An ArchLucid subscription does not grant this capability.</summary>
public sealed class SecureNowFreePublicIpAssessmentOptions
{
    public const string SectionName = "SecureNow:FreePublicIpAssessment";

    public bool Enabled { get; set; }

    public ScopeContext[] AllowedScopes { get; set; } = [];

    public bool Allows(ScopeContext scope) =>
        Enabled && scope.TenantId != Guid.Empty && scope.WorkspaceId != Guid.Empty && scope.ProjectId != Guid.Empty
        && AllowedScopes.Any(grant => grant.TenantId == scope.TenantId
            && grant.WorkspaceId == scope.WorkspaceId && grant.ProjectId == scope.ProjectId);
}
