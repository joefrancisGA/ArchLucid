using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Mirrors <c>export-transparency-trail-section.ts</c> for sponsor PDF/DOCX career exports (FC-32).
/// </summary>
public static class TransparencyTrailMarkdownFormatter
{
    public const string ExportIncompleteBanner =
        "> **Career export blocked (ADR 0073):** This sealed record does not include a complete transparency trail (asserted, inferred, skipped). Do not treat this artifact as a defensible stamp.";

    public static bool IsComplete(TransparencyTrail? trail) => trail is not null;

    public static void AppendMarkdownSection(StringBuilder sb, TransparencyTrail? trail)
    {
        ArgumentNullException.ThrowIfNull(sb);

        if (!IsComplete(trail))
        {
            sb.AppendLine(ExportIncompleteBanner);
            sb.AppendLine();

            return;
        }

        TransparencyTrail completeTrail = trail!;

        sb.AppendLine("## Transparency trail");
        sb.AppendLine();
        sb.AppendLine("What was asserted, inferred, and skipped for this review.");
        sb.AppendLine();
        AppendAssertedSection(sb, completeTrail.Asserted);
        AppendInferredSection(sb, completeTrail.Inferred);
        AppendSkippedSections(sb, completeTrail.Skipped);
        sb.AppendLine();
    }

    private static void AppendAssertedSection(StringBuilder sb, IReadOnlyList<AssertedTrailEntry> asserted)
    {
        sb.AppendLine($"### Asserted ({asserted.Count})");
        sb.AppendLine();

        if (asserted.Count == 0)
        {
            sb.AppendLine("_None recorded._");
            sb.AppendLine();

            return;
        }

        foreach (AssertedTrailEntry entry in asserted)
        {
            sb.AppendLine($"- {entry.Key}: {entry.Value}");
        }

        sb.AppendLine();
    }

    private static void AppendInferredSection(StringBuilder sb, IReadOnlyList<InferredTrailEntry> inferred)
    {
        sb.AppendLine($"### Inferred ({inferred.Count})");
        sb.AppendLine();

        if (inferred.Count == 0)
        {
            sb.AppendLine("_None recorded._");
            sb.AppendLine();

            return;
        }

        foreach (InferredTrailEntry entry in inferred)
        {
            sb.AppendLine($"- {entry.Key}: {entry.Value} (confidence {entry.Confidence})");
        }

        sb.AppendLine();
    }

    private static void AppendSkippedSections(
        StringBuilder sb,
        IReadOnlyList<SkippedQuestionTrailEntry> skipped)
    {
        List<SkippedQuestionTrailEntry> mustSkipped =
            skipped.Where(static entry => entry.Tier == ElicitationQuestionTier.Must).ToList();
        List<SkippedQuestionTrailEntry> shouldSkipped =
            skipped.Where(static entry => entry.Tier != ElicitationQuestionTier.Must).ToList();

        if (mustSkipped.Count > 0)
        {
            sb.AppendLine($"### Skipped MUST questions ({mustSkipped.Count})");
            sb.AppendLine();

            foreach (SkippedQuestionTrailEntry entry in mustSkipped)
            {
                sb.AppendLine($"- {entry.QuestionKey}");
            }

            sb.AppendLine();
        }

        if (shouldSkipped.Count > 0)
        {
            sb.AppendLine($"### Skipped SHOULD questions ({shouldSkipped.Count})");
            sb.AppendLine();

            foreach (SkippedQuestionTrailEntry entry in shouldSkipped)
            {
                sb.AppendLine($"- {entry.QuestionKey}");
            }

            sb.AppendLine();
        }
    }
}
