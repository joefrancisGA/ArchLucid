using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Sponsor-facing evidence-basis verdict block aligned to <c>AGENT_OUTPUT_EVALUATION.md</c> label vocabulary.
/// </summary>
public static class SponsorEvidenceBasisVerdictMarkdownFormatter
{
    public static void AppendMarkdownSection(
        StringBuilder sb,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run,
        bool deferredScopePresent = false,
        SponsorRoiClaimDispositionResult? roiClaimGate = null)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(run);

        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(
            proof,
            deltas,
            run,
            deferredScopePresent,
            roiClaimGate);

        string labelsTable = SponsorEvidenceBasisLabelResolver.FormatLabelsForMarkdownTable(labels);

        if (run.RealModeFellBackToSimulator)
            labelsTable = PilotSimulatorSubstitutionHonestyCopy.AppendToProofPackageEvidenceBasisCell(labelsTable);

        sb.AppendLine("## Evidence basis");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Verdict:** {SponsorEvidenceBasisLabelResolver.DescribeVerdict(labels)}");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Labels applied:** {labelsTable}");
        sb.AppendLine();
        sb.AppendLine(
            "> These labels describe **product evidence posture** only — not legal, compliance, SOC 2, or third-party audit attestation. See repository `docs/library/AGENT_OUTPUT_EVALUATION.md` for definitions.");
        sb.AppendLine();
    }
}
