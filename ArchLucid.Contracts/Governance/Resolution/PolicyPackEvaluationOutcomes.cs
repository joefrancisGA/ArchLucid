namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>Per-assignment policy pack evaluation outcome persisted on execute-time governance scope.</summary>
public static class PolicyPackEvaluationOutcomes
{
    public const string Evaluated = "evaluated";

    public const string NotApplicable = "not_applicable";

    public const string Skipped = "skipped";

    public const string Failed = "failed";
}
