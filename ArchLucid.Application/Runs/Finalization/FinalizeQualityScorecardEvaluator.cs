using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Computes finalize scorecard dimensions on the server and turns them into blocking reasons
///     (TB-2321). Existential-assumption, skipped-MUST, transparency-trail, and degraded-coverage
///     dimensions are enforced by their own server gates and are intentionally not duplicated here.
/// </summary>
public static class FinalizeQualityScorecardEvaluator
{
    public static FinalizeQualityScorecardCounts Compute(
        ArchitectureRequest request,
        FindingsSnapshot findings,
        IReadOnlyDictionary<string, FindingDisposition> latestDispositions,
        FinalizeQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(latestDispositions);
        ArgumentNullException.ThrowIfNull(options);

        FindingSeverity minimumSeverity =
            PreCommitGateThresholdParser.TryParseMinimumSeverity(options.MinimumUnresolvedSeverity)
            ?? FindingSeverity.Error;

        int blockingFindings = 0;
        int uncovered = 0;
        int deferred = 0;
        int contradictions = 0;
        int cannotDetermine = 0;
        int verifyHypothesis = 0;
        int lowConfidence = 0;
        int unresolvedHighSeverity = 0;

        foreach (Finding finding in findings.Findings)
        {
            FindingDisposition? disposition = LookupDisposition(latestDispositions, finding);

            if (IsBlockingFinding(finding, disposition, minimumSeverity))
                blockingFindings++;

            if (FinalizeQualityFindingSignals.IsCoverageGapJobView(finding, disposition))
                uncovered++;

            if (FinalizeQualityFindingSignals.IsOpenDeferredJobView(finding, disposition))
                deferred++;

            if (FinalizeQualityFindingSignals.IsOpenContradictionJobView(finding, disposition))
                contradictions++;

            if (FinalizeQualityFindingSignals.IsOpenCannotDetermineJobView(finding, disposition))
                cannotDetermine++;

            if (FinalizeQualityFindingSignals.IsOpenVerifyHypothesisJobView(finding, disposition))
                verifyHypothesis++;

            if (!IsOpenHighSeverity(finding, disposition, minimumSeverity))
                continue;

            unresolvedHighSeverity++;

            if (finding.ConfidenceLevel == FindingConfidenceLevel.Low)
                lowConfidence++;
        }

        int unverifiedAssumptions = FinalizeAssumptionGateEvaluator.CollectOpenAssumptions(request, findings).Count;

        return new FinalizeQualityScorecardCounts(
            blockingFindings,
            uncovered,
            deferred,
            contradictions,
            cannotDetermine,
            verifyHypothesis,
            unverifiedAssumptions,
            lowConfidence,
            unresolvedHighSeverity);
    }

    /// <summary>Blocking reasons in the same order the UI scorecard lists them.</summary>
    public static IReadOnlyList<string> GetBlockingReasons(
        FinalizeQualityScorecardCounts counts,
        FinalizeQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(counts);
        ArgumentNullException.ThrowIfNull(options);

        List<string> reasons = [];

        if (counts.BlockingFindingCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.BlockingFindings(
                counts.BlockingFindingCount));
        }

        if (counts.UncoveredMandatoryRequirementCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.UncoveredMandatoryRequirements(
                counts.UncoveredMandatoryRequirementCount));
        }

        if (counts.OpenDeferredCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.OpenDeferred(
                counts.OpenDeferredCount));
        }

        if (counts.OpenContradictionCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.OpenContradictions(
                counts.OpenContradictionCount));
        }

        if (counts.OpenCannotDetermineCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.OpenCannotDetermine(
                counts.OpenCannotDetermineCount));
        }

        if (counts.OpenVerifyHypothesisCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.OpenVerifyHypotheses(
                counts.OpenVerifyHypothesisCount));
        }

        if (options.UnverifiedAssumptionBlockThreshold >= 1
            && counts.UnverifiedAssumptionCount >= options.UnverifiedAssumptionBlockThreshold)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.UnverifiedAssumptions(
                counts.UnverifiedAssumptionCount));
        }

        if (counts.LowExtractionConfidenceCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.LowExtractionConfidence(
                counts.LowExtractionConfidenceCount));
        }

        if (counts.UnresolvedHighSeverityDispositionCount > 0)
        {
            reasons.Add(FinalizeQualityScorecardBlockedReasonFormatter.UnresolvedHighSeverityDispositions(
                counts.UnresolvedHighSeverityDispositionCount));
        }

        return reasons;
    }

    /// <summary>
    ///     Policy-violation rows at or above the configured minimum that still lack a closing disposition.
    /// </summary>
    private static bool IsBlockingFinding(
        Finding finding,
        FindingDisposition? disposition,
        FindingSeverity minimumSeverity)
    {
        if (finding.IsMuted || finding.EnforcementTier == FindingEnforcementTier.Advisory)
            return false;

        if (finding.Severity < minimumSeverity)
            return false;

        return !FinalizeQualityFindingSignals.IsFinalizeResolved(finding, disposition);
    }

    /// <summary>
    ///     Advisory-tier findings are baseline guidance, never governance-blocking (same exclusion as
    ///     <see cref="PreFinalizeActiveFindingCounter" />), so they do not count as unresolved high-severity rows.
    /// </summary>
    private static bool IsOpenHighSeverity(
        Finding finding,
        FindingDisposition? disposition,
        FindingSeverity minimumSeverity)
    {
        if (finding.IsMuted || finding.EnforcementTier == FindingEnforcementTier.Advisory)
            return false;

        if (finding.Severity < minimumSeverity)
            return false;

        return !FinalizeQualityFindingSignals.IsFinalizeResolved(finding, disposition);
    }

    private static FindingDisposition? LookupDisposition(
        IReadOnlyDictionary<string, FindingDisposition> latestDispositions,
        Finding finding)
    {
        if (string.IsNullOrWhiteSpace(finding.FindingId))
            return null;

        return latestDispositions.TryGetValue(finding.FindingId.Trim(), out FindingDisposition disposition)
            ? disposition
            : null;
    }
}
