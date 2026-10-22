using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecurityEvidencePathSearchContinuation
{
    public static PrivilegePathEnumerationResult ApplyIfNeeded(
        InventoryPrivilegePathGraphSnapshot graph,
        PrivilegePathEnumerationResult firstPage,
        bool continuationEnabled,
        SecureNowArchitectEngineRunScope? runScope,
        Guid tenantId,
        Guid snapshotId)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(firstPage);

        if (!continuationEnabled || firstPage.LimitHits.Count == 0)
        {
            return firstPage;
        }

        PrivilegePathEngineOptions continuationOptions = PrivilegePathEngineOptions.CreateContinuation();
        PrivilegePathEnumerationResult continuationPage = PrivilegePathEnumerator.EnumerateWithLimits(
            graph,
            continuationOptions,
            runScope);

        IReadOnlyList<PrivilegePathCandidate> merged = SecurityEvidencePathSearchContinuationMerger.MergePrivilegeCandidates(
            tenantId,
            snapshotId,
            firstPage.Candidates,
            continuationPage.Candidates);

        return new PrivilegePathEnumerationResult
        {
            Candidates = merged,
            LimitHits = continuationPage.LimitHits,
        };
    }

    public static ReachabilityPathEnumerationResult ApplyIfNeeded(
        InventoryReachabilityPathGraphSnapshot graph,
        ReachabilityPathEnumerationResult firstPage,
        bool continuationEnabled,
        SecureNowArchitectEngineRunScope? runScope,
        Guid tenantId,
        Guid snapshotId)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(firstPage);

        if (!continuationEnabled || firstPage.LimitHits.Count == 0)
        {
            return firstPage;
        }

        PrivilegePathEngineOptions continuationOptions = PrivilegePathEngineOptions.CreateContinuation();
        ReachabilityPathEnumerationResult continuationPage = IntendedReachabilityPathEnumerator.EnumerateWithLimits(
            graph,
            continuationOptions,
            runScope);

        IReadOnlyList<ReachabilityPathCandidate> merged = SecurityEvidencePathSearchContinuationMerger.MergeReachabilityCandidates(
            tenantId,
            snapshotId,
            firstPage.Candidates,
            continuationPage.Candidates);

        return new ReachabilityPathEnumerationResult
        {
            Candidates = merged,
            LimitHits = continuationPage.LimitHits,
        };
    }
}
