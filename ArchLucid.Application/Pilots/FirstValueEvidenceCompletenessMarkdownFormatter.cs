using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Visible Strong / Partial / Incomplete classification for Markdown first-value exports.</summary>
public static class FirstValueEvidenceCompletenessMarkdownFormatter
{
    /// <summary>Appended near the top of the report so sponsors see classification before deltas.</summary>
    public static void AppendMarkdownSection(StringBuilder sb, FirstValueEvidenceCompletenessLevel level)
    {
        ArgumentNullException.ThrowIfNull(sb);
        sb.AppendLine("## First-value evidence completeness");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Classification:** **{Describe(level)}** — deterministic from committed run proofs and the buyer-safe gate (demo tenants and structural gaps are never treated as externally sponsor-complete).");

        if (level == FirstValueEvidenceCompletenessLevel.Incomplete)
        {
            sb.AppendLine();
            sb.AppendLine(
                "> **Watermark notice:** Incomplete packages **still export** — the PDF repeats a visible banner on every page. Do **not** treat this artefact as sponsor-ready evidence until gaps are cleared.");
            sb.AppendLine();
        }

        sb.AppendLine();
    }

    private static string Describe(FirstValueEvidenceCompletenessLevel level) => level switch
    {
        FirstValueEvidenceCompletenessLevel.Strong => "Strong",
        FirstValueEvidenceCompletenessLevel.Partial => "Partial",
        FirstValueEvidenceCompletenessLevel.Incomplete => "Incomplete",
        _ => throw new ArgumentOutOfRangeException(nameof(level), level, null)
    };
}
