using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Server mirror of the UI finding-quality classifiers (<c>finding-quality-signals.ts</c>). Phrase lists must
///     stay in sync so the API rejects exactly what the Finalize button already refuses.
/// </summary>
public static class FinalizeQualityFindingSignals
{
    private static readonly string[] CannotDeterminePhrases =
    [
        "cannot determine",
        "cannot verify",
        "insufficient evidence",
        "unable to verify",
        "cannot validate",
        "cannot confirm",
    ];

    private static readonly string[] MissingFactPhrases =
    [
        "missing",
        "not found",
        "unknown",
        "not documented",
        "absent",
    ];

    private static readonly string[] ContradictionPhrases =
    [
        "contradict",
        "conflicts with",
        "opposite conclusion",
        "diagram vs",
    ];

    private static readonly string[] HypothesisPhrases =
    [
        "hypothesis",
        "exploratory challenge",
        "speculative",
        "adversarial challenge",
        "falsify/confirm with",
    ];

    private static readonly string[] CoverageGapPhrases =
    [
        "uncovered requirement",
        "no design decision",
        "requirement lacks",
    ];

    private static readonly string[] FailureModeGapPhrases =
    [
        "missing",
        "not documented",
        "unknown",
    ];

    private static readonly string[] DataClassGapPhrases =
    [
        "unknown",
        "missing",
    ];

    /// <summary>Human review or a closing disposition removes the finding from every open-work dimension.</summary>
    public static bool IsFinalizeResolved(Finding finding, FindingDisposition? latestDisposition)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.HumanReviewStatus is FindingHumanReviewStatus.Approved or FindingHumanReviewStatus.Overridden)
            return true;

        return latestDisposition is FindingDisposition.Accepted
            or FindingDisposition.Remediated
            or FindingDisposition.RejectedAsNotApplicable;
    }

    /// <summary>Deferred rows are parked, not open questions or coverage gaps (job-view priority order).</summary>
    public static bool IsDeferred(FindingDisposition? latestDisposition)
    {
        return latestDisposition is FindingDisposition.Deferred;
    }

    public static bool IsAdversarialHypothesisLane(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted)
            return false;

        if (ReadProperty(finding, "architectureIntelligence.adversarialLane") == "AdversarialChallenge")
            return true;

        return ReadProperty(finding, "architectureIntelligence.provenancePresentation") == "Hypothesis";
    }

    public static bool IsMergeConflict(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted)
            return false;

        if (string.Equals(finding.PolicyRuleId?.Trim(), "finding-merge-conflict", StringComparison.Ordinal))
            return true;

        return ReadProperty(finding, "findingMerge.conflict") == "True";
    }

    public static bool IsContradiction(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted)
            return false;

        if (NormalizedRule(finding).Contains("contradict", StringComparison.Ordinal))
            return true;

        return ContainsAny(CombinedText(finding), ContradictionPhrases);
    }

    /// <summary>TB-2302: blocked checks and missing facts on ungrounded high-severity rows are open questions.</summary>
    public static bool IsCannotDetermine(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted || IsAdversarialHypothesisLane(finding))
            return false;

        string text = CombinedText(finding);

        if (ContainsAny(text, CannotDeterminePhrases))
            return true;

        if (!IsUngrounded(finding) || finding.Severity < FindingSeverity.Error)
            return false;

        return ContainsAny(text, MissingFactPhrases);
    }

    public static bool IsVerifyHypothesis(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted)
            return false;

        if (IsAdversarialHypothesisLane(finding))
            return true;

        // UI: AI-generated + Ungrounded with Heuristic/MissingCitation label. Without a policy rule and without
        // evidence refs the inferred label is always one of those two, so ungrounded alone is sufficient here.
        if (IsUngrounded(finding))
            return true;

        return ContainsAny(CombinedText(finding), HypothesisPhrases);
    }

    /// <summary>TB-2308 / TB-2313 / TB-2314: requirement, failure-mode, and data-class coverage gaps.</summary>
    public static bool IsCoverageGap(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted)
            return false;

        string rule = NormalizedRule(finding);

        if (rule.Contains("requirement-coverage", StringComparison.Ordinal)
            || rule.Contains("requirement_coverage", StringComparison.Ordinal))
            return true;

        string text = CombinedText(finding);

        if (ContainsAny(text, CoverageGapPhrases))
            return true;

        if (text.Contains("failure mode", StringComparison.Ordinal) && ContainsAny(text, FailureModeGapPhrases))
            return true;

        bool mentionsDataClass = text.Contains("data classification", StringComparison.Ordinal)
            || text.Contains("data class", StringComparison.Ordinal);

        return mentionsDataClass && ContainsAny(text, DataClassGapPhrases);
    }

    /// <summary>
    ///     Mirrors <c>classifyReviewFindingJobView === "answer-these-questions"</c>: earlier job-view buckets
    ///     (deferred, closed, contradiction, merge conflict) win over the cannot-determine classifier.
    /// </summary>
    public static bool IsOpenCannotDetermineJobView(Finding finding, FindingDisposition? latestDisposition)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted || IsDeferred(latestDisposition) || IsFinalizeResolved(finding, latestDisposition))
            return false;

        if (IsContradiction(finding) || IsMergeConflict(finding))
            return false;

        return IsCannotDetermine(finding);
    }

    /// <summary>Mirrors <c>classifyReviewFindingJobView === "coverage-gaps"</c>, including all higher-priority buckets.</summary>
    public static bool IsCoverageGapJobView(Finding finding, FindingDisposition? latestDisposition)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.IsMuted || IsDeferred(latestDisposition) || IsFinalizeResolved(finding, latestDisposition))
            return false;

        if (IsContradiction(finding) || IsMergeConflict(finding) || IsCannotDetermine(finding) || IsVerifyHypothesis(finding))
            return false;

        return IsCoverageGap(finding);
    }

    /// <summary>
    ///     No deterministic rule and no citations. <see cref="Findings.FindingTrustLabelMapper" /> emits
    ///     Heuristic/MissingCitation (both "Ungrounded" in the UI) for exactly this shape on non-simulator,
    ///     non-degraded runs; simulator runs never reach commit and degraded fallbacks are the accepted gap.
    /// </summary>
    internal static bool IsUngrounded(Finding finding)
    {
        return string.IsNullOrWhiteSpace(finding.PolicyRuleId) && finding.EvidenceRefs.Count == 0;
    }

    private static string CombinedText(Finding finding)
    {
        string actions = string.Join("\n", finding.RecommendedActions);

        return $"{finding.Title}\n{actions}\n{finding.Rationale}".ToLowerInvariant();
    }

    private static string NormalizedRule(Finding finding)
    {
        return (finding.PolicyRuleId ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool ContainsAny(string lowerText, IReadOnlyList<string> needles)
    {
        return needles.Any(needle => lowerText.Contains(needle, StringComparison.Ordinal));
    }

    private static string? ReadProperty(Finding finding, string key)
    {
        if (!finding.Properties.TryGetValue(key, out string? value) || string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}
