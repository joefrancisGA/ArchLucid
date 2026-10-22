using System.Text;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Exports;

/// <summary>LP-16 — draft/desk open questions are not sealed asserted intake (WS-19 / ADR 0073).</summary>
public static class OpenQuestionsExportHonesty
{
    public const string WorkingDocumentHonestyLabel = "Working document — not sealed";

    public const string WorkingDocumentExportHeading = "Open questions (working document — not sealed)";

    public static bool IsOpenQuestionsTransparencyTrailKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return false;
        }

        string normalized = key.Trim().ToLowerInvariant().Replace('_', '-');

        if (normalized is "openquestions" or "open-questions")
        {
            return true;
        }

        return normalized.StartsWith("openquestions.", StringComparison.Ordinal)
            || normalized.StartsWith("open-questions.", StringComparison.Ordinal);
    }

    public static (IReadOnlyList<AssertedTrailEntry> Asserted, IReadOnlyList<OpenQuestionsWorkingDocumentExportEntry> WorkingDocumentOpenQuestions)
        SanitizeAssertedForCareerExport(IReadOnlyList<AssertedTrailEntry> asserted)
    {
        ArgumentNullException.ThrowIfNull(asserted);

        List<AssertedTrailEntry> sealedAsserted = [];
        List<OpenQuestionsWorkingDocumentExportEntry> workingDocumentOpenQuestions = [];

        foreach (AssertedTrailEntry entry in asserted)
        {
            if (entry is null)
            {
                continue;
            }

            if (IsOpenQuestionsTransparencyTrailKey(entry.Key))
            {
                workingDocumentOpenQuestions.Add(new OpenQuestionsWorkingDocumentExportEntry
                {
                    Key = entry.Key,
                    Value = entry.Value,
                });

                continue;
            }

            sealedAsserted.Add(entry);
        }

        return (sealedAsserted, workingDocumentOpenQuestions);
    }

    public static void AppendWorkingDocumentMarkdownSection(
        StringBuilder sb,
        IReadOnlyList<OpenQuestionsWorkingDocumentExportEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count == 0)
        {
            return;
        }

        sb.AppendLine($"## {WorkingDocumentExportHeading}");
        sb.AppendLine();
        sb.AppendLine(
            $"> **{WorkingDocumentHonestyLabel}:** Draft follow-ups are not asserted intake unless recorded through the transparency trail with confirm.");
        sb.AppendLine();

        foreach (OpenQuestionsWorkingDocumentExportEntry entry in entries)
        {
            sb.AppendLine($"- {entry.Key}: {entry.Value}");
        }

        sb.AppendLine();
    }
}
