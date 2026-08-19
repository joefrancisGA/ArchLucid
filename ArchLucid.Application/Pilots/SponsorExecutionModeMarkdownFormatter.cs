using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Pilots;

/// <summary>Sponsor-facing execution-mode copy shared across export surfaces (INV-002).</summary>
public static class SponsorExecutionModeMarkdownFormatter
{
    public static string FormatSponsorExecutionMode(ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(run);

        string label = StructuralExecutionModeLabels.ToDisplayLabel(run.StructuralExecutionMode);

        string caveat = run.StructuralExecutionMode switch
        {
            StructuralExecutionMode.Real =>
                "Live model path for agent steps (no recorded simulator substitution for this run).",
            StructuralExecutionMode.Simulator =>
                "**Not real-mode AI** — deterministic simulator; do not claim live model quality.",
            StructuralExecutionMode.Fallback =>
                "**Fallback recorded** — real path attempted but simulator substitution persisted.",
            StructuralExecutionMode.Mixed =>
                "**Mixed** — review per-agent traces before sponsor send.",
            _ => StructuralExecutionModeLabels.ToOperatorDetail(run.StructuralExecutionMode),
        };

        return $"**{label}** — {caveat}";
    }

    public static void AppendMarkdownSection(StringBuilder sb, ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(run);

        sb.AppendLine("## Execution mode");
        sb.AppendLine();
        sb.AppendLine(FormatSponsorExecutionMode(run));

        if (run.RealModeFellBackToSimulator)
        {
            sb.AppendLine();
            sb.AppendLine(
                "> **Simulator substitution:** This run recorded fallback from a real model path. Do not describe outputs as unqualified live-model proof.");
        }

        sb.AppendLine();
    }
}
