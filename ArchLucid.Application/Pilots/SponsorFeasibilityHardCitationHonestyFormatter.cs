using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.CareerArtifacts;

namespace ArchLucid.Application.Pilots;

/// <summary>LN-022 — sponsor PDF lists hard infeasible with citations or omits uncited hard (ADR 0093).</summary>
public static class SponsorFeasibilityHardCitationHonestyFormatter
{
    public static IReadOnlyList<string> RenderPlainTextLines(FeasibilityVerdict? verdict)
    {
        if (verdict is null)
        {
            return [];
        }

        if (verdict.Kind == FeasibilityVerdictKind.HardInfeasible)
        {
            if (!WorkingCareerHardInfeasibleCitationValidator.HasHardInfeasibleCitation(verdict))
            {
                return
                [
                    "Feasibility: hard infeasible claim withheld — missing law or theorem citation (ADR 0093).",
                ];
            }

            List<string> lines = ["Feasibility hard citations:"];

            foreach (FeasibilityHardCitation citation in verdict.HardCitations)
            {
                if (string.IsNullOrWhiteSpace(citation.Reference))
                {
                    continue;
                }

                lines.Add($"- {citation.Kind}: {citation.Reference.Trim()}");
            }

            foreach (string key in verdict.UnsatCoreInvariantKeys)
            {
                if (string.IsNullOrWhiteSpace(key))
                {
                    continue;
                }

                lines.Add($"- Invariant: {key.Trim()}");
            }

            return lines;
        }

        if (verdict.Kind == FeasibilityVerdictKind.SoftInfeasible && verdict.SoftEnvelope is not null)
        {
            return
            [
                "Feasibility: soft infeasible envelope — labeled assumptions, not Career-hard proof.",
                $"Envelope: {verdict.SoftEnvelope.EnvelopeDescription}",
            ];
        }

        return [];
    }

    public static string FormatVerdictKindLabelForSponsor(FeasibilityVerdict? verdict)
    {
        if (verdict is null)
        {
            return "Unknown";
        }

        if (verdict.Kind == FeasibilityVerdictKind.HardInfeasible
            && !WorkingCareerHardInfeasibleCitationValidator.HasHardInfeasibleCitation(verdict))
        {
            return "Infeasibility verdict needs citation";
        }

        return verdict.Kind switch
        {
            FeasibilityVerdictKind.SoftInfeasible => "Soft infeasible",
            FeasibilityVerdictKind.HardInfeasible => "Hard infeasible",
            _ => verdict.Kind.ToString(),
        };
    }
}
