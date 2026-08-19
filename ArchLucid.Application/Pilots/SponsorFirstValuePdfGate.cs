using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Server-side sponsor PDF export gates — mirrors operator-shell blocks on projected dollars and PilotStrict posture.</summary>
public static class SponsorFirstValuePdfGate
{
    public static void EnsureCanGenerate(FirstValueReportBuildResult built)
    {
        ArgumentNullException.ThrowIfNull(built);

        string? blockReason = ResolveBlockReason(built);

        if (blockReason is not null)
            throw new SponsorFirstValuePdfBlockedException(blockReason);
    }

    public static string? ResolveBlockReason(FirstValueReportBuildResult built)
    {
        ArgumentNullException.ThrowIfNull(built);

        if (built.SponsorProofReadiness == SponsorProofReadinessClassification.DemoOnly)
            return "Sponsor PDF export is blocked for demo-derived runs. Use internal walkthrough exports only.";

        if (built.SponsorProofReadiness == SponsorProofReadinessClassification.Incomplete)
            return "Sponsor PDF export is blocked until the first-value report proof package is complete.";

        ProofPackageCompletenessResponse? proof = built.ProofPackageCompleteness;

        if (proof is null)
            return null;

        if (!proof.AgentOutputPilotStrictEvidenceSatisfied)
        {
            return "Sponsor PDF export is blocked until PilotStrict agent-output quality evidence passes for this run.";
        }

        if (proof.RoiBaselineInputs is not null && !proof.RoiBaselineInputs.ProjectedDollarClaimsSponsorSafe)
        {
            return "Sponsor PDF export is blocked until buyer-provided ROI baselines make projected-dollar claims sponsor-safe.";
        }

        if (built.SponsorProofReadiness == SponsorProofReadinessClassification.NeedsBaseline)
        {
            return "Sponsor PDF export is blocked until ROI baseline inputs are captured and sponsor-safe.";
        }

        return null;
    }
}
