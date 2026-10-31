using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Compact sponsor-facing interpretation of persisted evidence pointers for the top-severity finding — no new factual
///     claims beyond what deltas and proof completeness already encode.
/// </summary>
public static class FindingTrustEvidenceCardMarkdownFormatter
{
    /// <summary>Appends a short Markdown block after the raw evidence-chain table.</summary>
    public static void AppendMarkdownSection(
        StringBuilder sb,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        ArchitectureRun? run = null)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);

        sb.AppendLine("## Why this top finding is trustworthy (evidence card)");
        sb.AppendLine();
        sb.AppendLine(
            "**Not** a legal attestation, formal verification, model warranty, or third-party audit. This card summarizes **persisted pointers** ArchLucid can show for human review; gaps stay visible.");
        sb.AppendLine();

        if (deltas.TopFindingId is null)
        {
            sb.AppendLine(FormattableString.Invariant($"_({PilotTopFindingEvidenceChainHonestyCopy.NoFindingsSkipPlain})_"));
            sb.AppendLine();

            return;
        }

        sb.AppendLine("### Top-severity finding");
        sb.AppendLine();
        sb.AppendLine("| Field | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Finding id | {FormatInlineCodeCell(string.IsNullOrWhiteSpace(deltas.TopFindingId) ? "Finding id was not stored." : deltas.TopFindingId.Trim())} |");
        sb.AppendLine(CultureInfo.InvariantCulture,
            $"| Severity (selected for excerpt) | {FormatInlineCodeCell(PilotTopFindingPresentationHonestyCopy.ResolveTopFindingSeverity(deltas))} |");

        FindingEvidenceChainResponse? chain = deltas.TopFindingEvidenceChain;

        if (chain is null)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Evidence chain | {PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse} |");
        }
        else
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Manifest version (chain) | {FormatInlineCodeCell(chain.ManifestVersion ?? "Manifest version was not stored.")} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Findings snapshot id | {FormatInlineCodeCell(FormatGuid(chain.FindingsSnapshotId, "Findings snapshot id was not stored."))} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Context snapshot id | {FormatInlineCodeCell(FormatGuid(chain.ContextSnapshotId, "Context snapshot id was not stored."))} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Graph snapshot id | {FormatInlineCodeCell(FormatGuid(chain.GraphSnapshotId, "Graph snapshot id was not stored."))} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Decision trace id | {FormatInlineCodeCell(FormatGuid(chain.DecisionTraceId, "Decision trace id was not stored."))} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Golden manifest id | {FormatInlineCodeCell(FormatGuid(chain.GoldenManifestId, "Golden manifest id was not stored."))} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Related graph nodes | {PilotSponsorMaterialFindingsHonestyCopy.FormatRelatedGraphNodeCount(chain.RelatedGraphNodeIds.Count)} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Agent execution traces | {PilotSponsorMaterialFindingsHonestyCopy.FormatAgentExecutionTraceCount(chain.AgentExecutionTraceIds.Count)} |");
        }

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Buyer-safe proof sendability (API checklist) | {PilotSponsorSafeSendableAllClearHonestyCopy.FormatProofSendabilityMirrorCell(proof)} |");

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Sponsor-proof readiness | {FormatSponsorProofReadiness(proof.SponsorProofReadiness)} |");

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Agent output quality (PilotStrict, when attested) | {PilotAgentOutputPilotStrictHonestyCopy.FormatEvidenceCardCell(proof)} |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Evidence-basis label (top finding) | {DescribeTopFindingEvidenceBasis(deltas, proof, run)} |");

        ArchitectureRun basisRun = run ?? new ArchitectureRun { RealModeFellBackToSimulator = false };

        TopFindingEvidenceSufficiency? sufficiency =
            TopFindingEvidenceSufficiencyClassifier.Classify(deltas, proof, basisRun);

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Evidence sufficiency (top finding) | {TopFindingEvidenceSufficiencyClassifier.DescribeForMarkdownTable(sufficiency)} |");

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Confidence class (machine-readable) | {FormatInlineCodeCell(TopFindingEvidenceSufficiencyClassifier.DescribeConfidenceClass(sufficiency))} |");

        if (sufficiency is TopFindingEvidenceSufficiency.Low or TopFindingEvidenceSufficiency.Insufficient)
        {
            sb.AppendLine(
                "| Sponsor guard label | **Not definitive** — low-evidence top finding; disclose basis before sponsor circulation. |");
        }

        sb.AppendLine("| Human qualitative review | **Required** — automation does not replace sponsor judgment. |");
        sb.AppendLine();
    }

    private static string DescribeTopFindingEvidenceBasis(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        ArchitectureRun? run)
    {
        ArchitectureRun basisRun = run ?? new ArchitectureRun { RealModeFellBackToSimulator = false };
        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(proof, deltas, basisRun);
        return SponsorEvidenceBasisLabelResolver.FormatLabelsForMarkdownTable(labels);
    }

    private static string FormatGuid(Guid? id, string missingValue = "(none)")
    {
        return id is null ? missingValue : id.Value.ToString("D");
    }

    private static string FormatSponsorProofReadiness(string? value) =>
        PilotSponsorProofReadinessUnresolvedHonestyCopy.FormatProofPackageCell(value);

    private static string FormatInlineCodeCell(string value)
        => FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(value);
}
