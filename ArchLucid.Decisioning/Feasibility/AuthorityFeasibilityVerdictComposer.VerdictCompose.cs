using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

public sealed partial class AuthorityFeasibilityVerdictComposer
{
    private static bool IsFeasible(ManifestDocument manifest, TransparencyTrail trail)
    {
        if (!string.Equals(manifest.Metadata.Status, "Resolved", StringComparison.OrdinalIgnoreCase))
            return false;

        if (manifest.Policy.Violations.Count > 0)
            return false;

        if (manifest.UnresolvedIssues.Items.Count > 0)
            return false;

        if (manifest.Requirements.Uncovered.Exists(static item => item.IsMandatory))
            return false;

        if (trail.HasSkippedMustQuestions)
            return false;

        return true;
    }

    private static string BuildSoftSummary(ManifestDocument manifest, TransparencyTrail trail)
    {
        if (trail.HasSkippedMustQuestions)
            return "Architecture run completed with unanswered MUST-tier intake questions.";

        if (manifest.Policy.Violations.Count > 0)
            return "Policy controls are not satisfied for the proposed architecture.";

        if (manifest.UnresolvedIssues.Items.Count > 0)
            return "Authority pipeline left unresolved design issues on the manifest.";

        if (manifest.Requirements.Uncovered.Exists(static item => item.IsMandatory))
            return "Mandatory requirements remain uncovered after rule evaluation.";

        if (!string.Equals(manifest.Metadata.Status, "Resolved", StringComparison.OrdinalIgnoreCase))
            return "Manifest status indicates the design still needs operator attention.";

        return "Authority pipeline surfaced soft infeasibility signals on the committed manifest.";
    }

    private static SoftInfeasibilityEnvelope BuildSoftEnvelope(ManifestDocument manifest, TransparencyTrail trail)
    {
        int confidenceLow = 45;
        int confidenceHigh = 80;

        if (trail.HasSkippedMustQuestions)
        {
            confidenceLow = 35;
            confidenceHigh = 65;
        }

        if (manifest.Policy.Violations.Count > 0)
        {
            confidenceLow = 50;
            confidenceHigh = 85;
        }

        return new SoftInfeasibilityEnvelope
        {
            ConfidenceLow = confidenceLow,
            ConfidenceHigh = confidenceHigh,
            EnvelopeDescription =
                "Verdict holds for the evaluated manifest snapshot; relaxing constraints or answering skipped MUST questions may change the outcome.",
            SoftAssumption =
                "Operator assertions and inferred intake entries accurately represent deployment intent for this run.",
            CostOfBeingWrong =
                "Treating a soft infeasible design as production-ready may ship policy gaps or under-specified controls.",
        };
    }
}
