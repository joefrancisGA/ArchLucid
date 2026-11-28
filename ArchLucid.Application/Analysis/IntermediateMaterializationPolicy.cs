namespace ArchLucid.Application.Analysis;

/// <summary>
/// Evaluates optional artifact economics. A favorable decision is evidence for a pilot,
/// not runtime authorization to write or read any artifact.
/// </summary>
public static class IntermediateMaterializationPolicy
{
    public const int Version = 1;

    public enum Disposition
    {
        ProtectedOutput,
        OutsideBudget,
        Uncalibrated,
        Recompute,
        Candidate,
    }

    /// <summary>All costs must use the same calibrated unit and retention window.</summary>
    public readonly record struct Costs(
        decimal? Recompute, decimal? Read, decimal? EncodeAndWrite, decimal? Retention, decimal? ExpectedHits);

    public readonly record struct Admission(
        bool OptionalAndRecomputable, long Bytes, long MaximumEntryBytes, long AvailableBytes,
        TimeSpan Lifetime, TimeSpan MaximumLifetime);

    public readonly record struct Decision(Disposition Outcome, decimal? ExpectedNetSavings);

    public static Decision Evaluate(Admission admission, Costs costs, decimal minimumSavings = 0)
    {
        if (!admission.OptionalAndRecomputable)
            return new(Disposition.ProtectedOutput, null);

        if (admission.Bytes <= 0 || admission.MaximumEntryBytes <= 0 ||
            admission.Bytes > admission.MaximumEntryBytes || admission.Bytes > admission.AvailableBytes ||
            admission.Lifetime <= TimeSpan.Zero || admission.Lifetime > admission.MaximumLifetime)
            return new(Disposition.OutsideBudget, null);

        if (costs is not { Recompute: > 0, Read: >= 0, EncodeAndWrite: >= 0, Retention: >= 0, ExpectedHits: >= 0 }
            || minimumSavings < 0)
            return new(Disposition.Uncalibrated, null);

        try
        {
            decimal netSavings = costs.ExpectedHits.GetValueOrDefault() * (costs.Recompute.GetValueOrDefault() - costs.Read.GetValueOrDefault())
                - costs.EncodeAndWrite.GetValueOrDefault() - costs.Retention.GetValueOrDefault();
            return new(netSavings > minimumSavings ? Disposition.Candidate : Disposition.Recompute, netSavings);
        }
        catch (OverflowException)
        {
            return new(Disposition.Uncalibrated, null);
        }
    }
}
