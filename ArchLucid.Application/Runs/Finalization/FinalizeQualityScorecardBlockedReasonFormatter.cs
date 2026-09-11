namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Exact copy of the UI scorecard messages (<c>finalize-quality-scorecard.ts</c>) so a direct API caller sees
///     the same wording as the Finalize button.
/// </summary>
public static class FinalizeQualityScorecardBlockedReasonFormatter
{
    public static string BlockingFindings(int count)
    {
        string noun = count == 1 ? "finding" : "findings";

        return $"{count} unresolved blocking {noun} still need disposition.";
    }

    public static string UncoveredMandatoryRequirements(int count)
    {
        return $"{count} mandatory requirement{Plural(count)} lack a design decision.";
    }

    public static string OpenCannotDetermine(int count)
    {
        return $"{count} open question{Plural(count)} still need answers before the package is defensible.";
    }

    public static string OpenVerifyHypotheses(int count)
    {
        string findings = count == 1 ? "finding" : "findings";
        string objectPronoun = count == 1 ? "it" : "them";

        return $"{count} hypothesis {findings} still need evidence before treating {objectPronoun} as publishable fact.";
    }

    public static string OpenDeferred(int count)
    {
        string findings = count == 1 ? "finding" : "findings";

        return $"{count} deferred {findings} still need revisit before finalize.";
    }

    public static string OpenContradictions(int count)
    {
        string findings = count == 1 ? "finding" : "findings";

        return $"{count} contradiction {findings} still need reconciliation before finalize.";
    }

    public static string UnverifiedAssumptions(int count)
    {
        return $"{count} unverified assumptions remain — confirm or caveat existential ones before finalize.";
    }

    public static string LowExtractionConfidence(int count)
    {
        return $"{count} critical model field{Plural(count)} were extracted with low confidence — caveat or re-ingest before sponsor export.";
    }

    public static string UnresolvedHighSeverityDispositions(int count)
    {
        string noun = count == 1 ? "finding" : "findings";

        return $"{count} high-severity {noun} still need an accepted-risk disposition or decision-register row before finalize.";
    }

    private static string Plural(int count)
    {
        return count == 1 ? string.Empty : "s";
    }
}
