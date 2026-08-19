using System.Text.Json;

namespace ArchLucid.Cli.Validation;

/// <summary>
///     Loads known GA compliance rule ids from file-based rule packs for CLI deep validation.
/// </summary>
internal static class PolicyPackKnownRuleKeyResolver
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    internal static HashSet<string> TryLoadKnownRuleKeys()
    {
        HashSet<string> known = new(StringComparer.OrdinalIgnoreCase);

        foreach (string filePath in EnumerateCandidateRulePackFiles())
        {
            TryAddRuleIdsFromFile(filePath, known);
        }

        return known;
    }

    private static IEnumerable<string> EnumerateCandidateRulePackFiles()
    {
        List<string> candidates = [];

        string? repoRoot = TryFindRepoRoot();

        if (repoRoot is not null)
        {
            string decisioningDir = Path.Combine(
                repoRoot,
                "ArchLucid.Decisioning",
                "Compliance",
                "RulePacks");

            if (Directory.Exists(decisioningDir))
            {
                candidates.AddRange(Directory.EnumerateFiles(decisioningDir, "*.rules.json"));
            }
        }

        string outputDir = Path.Combine(AppContext.BaseDirectory, "Compliance", "RulePacks");

        if (Directory.Exists(outputDir))
        {
            candidates.AddRange(Directory.EnumerateFiles(outputDir, "*.rules.json"));
        }

        return candidates.Distinct(StringComparer.OrdinalIgnoreCase);
    }

    private static string? TryFindRepoRoot()
    {
        DirectoryInfo? directory = new(Directory.GetCurrentDirectory());

        while (directory is not null)
        {
            string marker = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(marker))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }

    private static void TryAddRuleIdsFromFile(string filePath, HashSet<string> known)
    {
        if (!File.Exists(filePath))
            return;

        string raw;

        try
        {
            raw = File.ReadAllText(filePath);
        }
        catch
        {
            return;
        }

        ComplianceRulePackFileDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<ComplianceRulePackFileDocument>(raw, Json);
        }
        catch (JsonException)
        {
            return;
        }

        if (document?.Rules is null)
            return;

        foreach (ComplianceRuleFileEntry rule in document.Rules)
        {
            if (!string.IsNullOrWhiteSpace(rule.RuleId))
                known.Add(rule.RuleId.Trim());
        }
    }

    private sealed class ComplianceRulePackFileDocument
    {
        public List<ComplianceRuleFileEntry>? Rules
        {
            get;
            set;
        }
    }

    private sealed class ComplianceRuleFileEntry
    {
        public string? RuleId
        {
            get;
            set;
        }
    }
}
