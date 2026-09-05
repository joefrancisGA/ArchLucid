using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance;

public sealed partial class RiskExceptionService
{
    private async Task<string> ResolveInspectCanonicalFindingIdAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken cancellationToken)
    {
        FindingInspectResponse? finding = await findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId.Trim(),
            cancellationToken,
            FindingInspectReadOptions.MetadataOnly);

        return finding?.FindingId ?? findingId.Trim();
    }

    private async Task EnsureWaiverAllowedForFindingWithInspectLookupAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken cancellationToken)
    {
        string lookupFindingId = await ResolveInspectCanonicalFindingIdAsync(scope, findingId, cancellationToken);

        await RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync(
            findingReviewTrailRepository,
            scope.TenantId,
            lookupFindingId,
            cancellationToken);
    }

    private async Task<RiskExceptionRecord?> FindActiveWaiverForFindingAsync(
        ScopeContext scope,
        string findingId,
        DateTimeOffset asOfUtc,
        CancellationToken cancellationToken)
    {
        string trimmedFindingId = findingId.Trim();
        IReadOnlyList<RiskExceptionRecord> activeWaivers = await repository.ListActiveForTenantAsync(
            scope.TenantId,
            scope.ProjectId,
            cancellationToken);

        return activeWaivers.FirstOrDefault(record =>
            record.WorkspaceId == scope.WorkspaceId
            && record.Status == RiskExceptionStatus.Active
            && record.ExpiresAtUtc > asOfUtc
            && string.Equals(record.FindingId, trimmedFindingId, StringComparison.OrdinalIgnoreCase));
    }

    private static ScopeContext BuildScopeFromRiskException(RiskExceptionRecord record)
    {
        return new ScopeContext
        {
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ProjectId = record.ProjectId,
        };
    }
}
