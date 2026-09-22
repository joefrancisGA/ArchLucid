using System.Security.Claims;

using ArchLucid.Application.Architecture;
using ArchLucid.Core.Search;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Support;

/// <summary>AS-094: omits global-search run/finding hits tied to restricted architectures the actor cannot view.</summary>
public sealed class GlobalSearchShareAccessFilter(IArchitectureShareAccessGate shareAccessGate)
{
    private readonly IArchitectureShareAccessGate _shareAccessGate =
        shareAccessGate ?? throw new ArgumentNullException(nameof(shareAccessGate));

    public async Task<GlobalSearchResult> FilterAsync(
        ClaimsPrincipal user,
        ScopeContext scope,
        GlobalSearchResult result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(result);

        List<GlobalSearchRunHit> visibleRuns = [];

        foreach (GlobalSearchRunHit run in result.Runs)
        {
            if (await CanExposeArchitectureScopedHitAsync(user, scope, run.ArchitectureId, cancellationToken))
                visibleRuns.Add(run);
        }

        List<GlobalSearchFindingHit> visibleFindings = [];

        foreach (GlobalSearchFindingHit finding in result.Findings)
        {
            if (await CanExposeArchitectureScopedHitAsync(user, scope, finding.ArchitectureId, cancellationToken))
                visibleFindings.Add(finding);
        }

        return new GlobalSearchResult
        {
            Runs = visibleRuns,
            Findings = visibleFindings,
            PolicyPacks = result.PolicyPacks,
        };
    }

    private async Task<bool> CanExposeArchitectureScopedHitAsync(
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid? architectureId,
        CancellationToken cancellationToken)
    {
        if (architectureId is not Guid resolvedArchitectureId)
            return true;

        ArchitectureShareAccessEvaluation access = await _shareAccessGate.EvaluateArchitectureAsync(
            user,
            scope,
            resolvedArchitectureId,
            cancellationToken);

        return access.CanRead;
    }
}
