using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Quick start analyzable-evidence gate (TB-2296) — mirrors
///     <c>archlucid-ui/src/lib/first-pilot-analyzable-evidence.ts</c>.
/// </summary>
public static class QuickStartAnalyzableEvidenceCompleteness
{
    public const int MinOperatorBriefCharacters = 100;

    private static readonly string[] ImageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

    /// <summary>
    ///     Adds a validation failure when Quick start metadata lacks analyzable evidence class and explicit limited-evidence ack.
    /// </summary>
    public static bool TryCollectFailures(ArchitectureRequest request, IList<FluentValidation.Results.ValidationFailure> failures)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(failures);

        if (!QuickStartIntakeRequestEnricher.RequiresL0MustSet(request))
            return false;

        if (HasAnalyzableEvidenceClass(request))
            return false;

        failures.Add(
            new FluentValidation.Results.ValidationFailure(
                $"{nameof(ArchitectureRequest.IntakeQuestionAnswers)}.{QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey}",
                "Quick start requires analyzable architecture evidence (brief, diagram, IaC, inventory export, or operational notes), "
                + "at least 100 characters of operator architecture context, or an explicit limited-evidence acknowledgment before starting."));

        return true;
    }

    internal static bool HasAnalyzableEvidenceClass(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        IReadOnlyDictionary<string, string> answers = request.IntakeQuestionAnswers
            ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        int operatorBriefCharacterCount = TryReadOperatorBriefCharacterCount(answers);
        IReadOnlyList<string> pendingFileNames = DecodePendingEvidenceFileNames(answers);

        if (HasLimitedEvidenceAcknowledgment(answers))
        {
            return operatorBriefCharacterCount >= MinOperatorBriefCharacters || pendingFileNames.Count > 0;
        }

        if (operatorBriefCharacterCount >= MinOperatorBriefCharacters)
            return true;

        return HasAnalyzableClassFromFileNames(pendingFileNames);
    }

    private static bool HasLimitedEvidenceAcknowledgment(IReadOnlyDictionary<string, string> answers)
    {
        if (!answers.TryGetValue(QuickStartIntakeMetadataKeys.LimitedEvidenceAnalysisAckKey, out string? ack))
            return false;

        return string.Equals(
            ack?.Trim(),
            QuickStartIntakeMetadataKeys.LimitedEvidenceAnalysisAckValue,
            StringComparison.OrdinalIgnoreCase);
    }

    private static int TryReadOperatorBriefCharacterCount(IReadOnlyDictionary<string, string> answers)
    {
        if (!answers.TryGetValue(QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey, out string? raw))
            return 0;

        return int.TryParse(raw?.Trim(), out int count) ? count : 0;
    }

    internal static IReadOnlyList<string> DecodePendingEvidenceFileNames(IReadOnlyDictionary<string, string> answers)
    {
        if (!answers.TryGetValue(QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey, out string? encoded)
            || string.IsNullOrWhiteSpace(encoded))
        {
            return [];
        }

        return encoded
            .Split(QuickStartIntakeMetadataKeys.PendingEvidenceFileNameDelimiter, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(static name => !string.IsNullOrWhiteSpace(name))
            .ToList();
    }

    private static bool HasAnalyzableClassFromFileNames(IReadOnlyList<string> fileNames)
    {
        foreach (string fileName in fileNames)
        {
            if (FileNameImpliesQuickStartClass(fileName) is not null)
                return true;
        }

        return false;
    }

    private static string? FileNameImpliesQuickStartClass(string fileName)
    {
        string lower = fileName.ToLowerInvariant();

        if (lower.Contains("inventory", StringComparison.Ordinal))
            return "cloud-inventory";

        if (lower.Contains(".bicep", StringComparison.Ordinal)
            || lower.Contains(".tf", StringComparison.Ordinal)
            || lower.Contains("terraform", StringComparison.Ordinal))
        {
            return "infrastructure-as-code";
        }

        if (lower.Contains("diagram", StringComparison.Ordinal)
            || lower.Contains("topology", StringComparison.Ordinal)
            || lower.Contains("drawio", StringComparison.Ordinal)
            || lower.Contains("architecture", StringComparison.Ordinal))
        {
            return "architecture-diagram";
        }

        if (lower.Contains("runbook", StringComparison.Ordinal)
            || lower.Contains("monitor", StringComparison.Ordinal)
            || lower.Contains("incident", StringComparison.Ordinal)
            || lower.Contains("slo", StringComparison.Ordinal))
        {
            return "operational-evidence";
        }

        if (lower.EndsWith(".md", StringComparison.Ordinal) || lower.Contains("brief", StringComparison.Ordinal))
            return "architecture-brief";

        if (ImageExtensions.Any(extension => lower.EndsWith(extension, StringComparison.Ordinal)))
            return null;

        if (lower.EndsWith(".pdf", StringComparison.Ordinal)
            || lower.EndsWith(".docx", StringComparison.Ordinal)
            || lower.EndsWith(".txt", StringComparison.Ordinal))
        {
            return "architecture-brief";
        }

        return null;
    }
}
