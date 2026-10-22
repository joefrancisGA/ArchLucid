using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Scoping;

/// <summary>
///     Builds <see cref="ScopeContext" /> for run-child repository reads from an authority run header (TB-076).
/// </summary>
public static class ScopeContextRunChildExtensions
{
    public static ScopeContext FromRunRecord(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new ScopeContext
        {
            TenantId = run.TenantId,
            WorkspaceId = run.WorkspaceId,
            ProjectId = run.ScopeProjectId,
        };
    }
}
