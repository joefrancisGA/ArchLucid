using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.CareerArtifacts;

/// <summary>LN-004 / ADR 0093 — Working Career export blocks uncited hard infeasible verdicts.</summary>
public static class WorkingCareerHardInfeasibleCitationValidator
{
    public const string UncitedHardCode = "uncited_hard_infeasible";

    public const string UncitedHardMessage =
        "Hard infeasibility requires a law, theorem, or invariant contradiction reference before export.";

    public static string? FormatBlockedReason(
        FeasibilityVerdict? verdict,
        bool workingDesk,
        CareerArtifactKind artifactKind)
    {
        if (!workingDesk || artifactKind != CareerArtifactKind.Export)
        {
            return null;
        }

        if (verdict is null || verdict.Kind != FeasibilityVerdictKind.HardInfeasible)
        {
            return null;
        }

        if (HasHardInfeasibleCitation(verdict))
        {
            return null;
        }

        return UncitedHardMessage;
    }

    public static bool HasHardInfeasibleCitation(FeasibilityVerdict verdict)
    {
        ArgumentNullException.ThrowIfNull(verdict);

        if (verdict.HardCitations.Any(static citation => !string.IsNullOrWhiteSpace(citation.Reference)))
        {
            return true;
        }

        return verdict.UnsatCoreInvariantKeys.Any(static key => !string.IsNullOrWhiteSpace(key));
    }
}
