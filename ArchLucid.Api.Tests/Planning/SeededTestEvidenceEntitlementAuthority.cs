using System.Collections.Concurrent;
using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// Test-only current resource ACL: only the explicitly seeded default-scope run.
/// This never grants cross-tenant reads, and client headers cannot add grants.
/// </summary>
internal sealed class SeededTestEvidenceEntitlementAuthority : IEvidenceEntitlementAuthority
{
    private readonly ConcurrentDictionary<Guid, byte> _seededRuns = new();

    public void Allow(Guid runId)
    {
        if (runId == Guid.Empty)
            throw new ArgumentException("A seeded run ID is required.", nameof(runId));
        _seededRuns.TryAdd(runId, 0);
    }

    public Task<bool> HasCurrentReadEntitlementAsync(
        ClaimsPrincipal principal, EvidenceReadResource resource, CancellationToken cancellationToken)
    {
        bool allowed = principal.Identity?.IsAuthenticated == true
            && resource.TenantId == ScopeIds.DefaultTenant
            && resource.WorkspaceId == ScopeIds.DefaultWorkspace
            && resource.ProjectId == ScopeIds.DefaultProject
            && _seededRuns.ContainsKey(resource.EvidenceId);
        return Task.FromResult(allowed);
    }
}

