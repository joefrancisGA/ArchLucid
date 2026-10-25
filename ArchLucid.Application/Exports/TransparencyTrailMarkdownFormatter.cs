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

<<<<<<< HEAD
    public const string AssertionKeyNotStoredLabel = "Assertion key was not stored.";

    public const string AssertionKeyStoredEmptyLabel = "Assertion key was stored empty.";

    public const string AssertionValueNotStoredLabel = "Assertion value was not stored.";

    public const string AssertionValueStoredEmptyLabel = "Assertion value was stored empty.";

    public const string SkippedQuestionKeyNotStoredLabel = "Question key was not stored.";

    public const string SkippedQuestionsNotRecordedLabel =
        "Skipped questions were not recorded on this transparency trail.";

    public static bool IsComplete(TransparencyTrail? trail) => trail is not null;
=======
    public const string SkippedQuestionsNotRecordedCopy =
        "Skipped questions were not recorded on this transparency trail.";

    public static bool IsComplete(TransparencyTrail? trail)
    {
        if (trail is null)
        {
            return false;
        }

        return trail.Asserted is not null && trail.Inferred is not null && trail.Skipped is not null;
    }
>>>>>>> origin/master

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

        (IReadOnlyList<AssertedTrailEntry> asserted, IReadOnlyList<OpenQuestionsWorkingDocumentExportEntry> workingDocumentOpenQuestions) =
            OpenQuestionsExportHonesty.SanitizeAssertedForCareerExport(completeTrail.Asserted);

        sb.AppendLine("## Transparency trail");
        sb.AppendLine();
        sb.AppendLine("What was asserted, inferred, and skipped for this review.");
        sb.AppendLine();
        AppendAssertedSection(sb, asserted);
        AppendInferredSection(sb, completeTrail.Inferred);
        AppendSkippedSections(sb, completeTrail.Skipped);
        OpenQuestionsExportHonesty.AppendWorkingDocumentMarkdownSection(sb, workingDocumentOpenQuestions);
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
            sb.AppendLine($"- {FormatAssertedTrailLine(entry)}");
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
            sb.AppendLine($"- {entry.FormatMarkdownExportLine()}");
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
                sb.AppendLine($"- {FormatSkippedTrailExportLine(entry)}");
            }

            sb.AppendLine();
        }

        if (shouldSkipped.Count > 0)
        {
            sb.AppendLine($"### Skipped SHOULD questions ({shouldSkipped.Count})");
            sb.AppendLine();

            foreach (SkippedQuestionTrailEntry entry in shouldSkipped)
            {
                sb.AppendLine($"- {FormatSkippedTrailExportLine(entry)}");
            }

            sb.AppendLine();
        }

        if (mustSkipped.Count == 0 && shouldSkipped.Count == 0)
        {
            sb.AppendLine("### Skipped questions (0)");
            sb.AppendLine();
<<<<<<< HEAD
            sb.AppendLine(SkippedQuestionsNotRecordedLabel);
            sb.AppendLine();
        }
    }

    internal static string FormatAssertedTrailLine(AssertedTrailEntry entry)
    {
        string key = entry.Key is null
            ? AssertionKeyNotStoredLabel
            : entry.Key.Trim().Length > 0
                ? entry.Key
                : AssertionKeyStoredEmptyLabel;

        return $"{key}: {FormatAssertedTrailValue(entry.Value)}";
    }

    internal static string FormatAssertedTrailValue(string? value)
    {
        if (value is null)
        {
            return AssertionValueNotStoredLabel;
        }

        return value.Trim().Length > 0 ? value : AssertionValueStoredEmptyLabel;
    }

    internal static string FormatSkippedTrailExportLine(SkippedQuestionTrailEntry entry)
    {
        return $"{FormatSkippedTrailQuestionKey(entry.QuestionKey)} ({entry.Tier})";
    }

    internal static string FormatSkippedTrailQuestionKey(string? questionKey)
    {
        string trimmed = questionKey?.Trim() ?? string.Empty;

        return trimmed.Length > 0 ? trimmed : SkippedQuestionKeyNotStoredLabel;
=======
            sb.AppendLine($"_{SkippedQuestionsNotRecordedCopy}_");
            sb.AppendLine();
        }
>>>>>>> origin/master
    }
}
