using System.Globalization;
using System.Text;
using ArchLucid.Contracts.Explanation;
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
        ProofPackageCompletenessResponse proof)
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
            sb.AppendLine("_(No findings on this run — no top-severity evidence card.)_");
            sb.AppendLine();

            return;
        }

        sb.AppendLine("### Top-severity finding");
        sb.AppendLine();
        sb.AppendLine("| Field | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Finding id | `{deltas.TopFindingId}` |");
        sb.AppendLine(CultureInfo.InvariantCulture,
            $"| Severity (selected for excerpt) | `{deltas.TopFindingSeverity ?? "Unknown"}` |");

        FindingEvidenceChainResponse? chain = deltas.TopFindingEvidenceChain;

        if (chain is null)
        {
            sb.AppendLine(
                "| Evidence chain | **Missing** — top finding did not resolve to a persisted chain (see table above). |");
        }
        else
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Manifest version (chain) | `{chain.ManifestVersion ?? "(none)"}` |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Findings snapshot id | `{FormatGuid(chain.FindingsSnapshotId)}` |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Context snapshot id | `{FormatGuid(chain.ContextSnapshotId)}` |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Graph snapshot id | `{FormatGuid(chain.GraphSnapshotId)}` |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Decision trace id | `{FormatGuid(chain.DecisionTraceId)}` |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Golden manifest id | `{FormatGuid(chain.GoldenManifestId)}` |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Related graph nodes | {chain.RelatedGraphNodeIds.Count} |");

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Agent execution traces | {chain.AgentExecutionTraceIds.Count} |");
        }

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Buyer-safe proof sendability (API checklist) | `{proof.ProofSendability}` · `{proof.PublishingTier}` |");

        sb.AppendLine($"| Agent output quality (PilotStrict, when attested) | {DescribePilotStrict(deltas)} |");
        sb.AppendLine("| Human qualitative review | **Required** — automation does not replace sponsor judgment. |");
        sb.AppendLine();
    }

    private static string DescribePilotStrict(PilotRunDeltas deltas)
    {
        if (!deltas.AgentOutputPilotStrictSignalsResolved)
        {
            return
                "PilotStrict posture **not fully attested** — execution-trace aggregation did not complete; do not infer pass/fail from silence.";
        }

        if (deltas.AgentOutputPilotStrictViolatesSponsorEvidence)
        {
            return "**Failed** — PilotStrict sponsor-evidence checks reported failures for this run.";
        }

        return "**No PilotStrict failures** recorded for attested traces on this run.";
    }

    private static string FormatGuid(Guid? id)
    {
        return id is null ? "(none)" : id.Value.ToString("D");
    }
}
