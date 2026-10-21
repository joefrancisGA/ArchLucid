using System.Text.RegularExpressions;

using ArchLucid.Core.Requests;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class ControlPhraseRawMatchingArchitectureTests
{
    private static readonly string[] ScanRelativeRoots =
    [
        "ArchLucid.Decisioning",
        "ArchLucid.Application/ArchitectureIntelligence",
        "ArchLucid.Application/Runs/Orchestration",
        "ArchLucid.Application/Diagnostics",
        "ArchLucid.Application/Evidence",
    ];

    private static readonly string[] AllowedRelativePathFragments =
    [
        "ControlPhraseCatalog.cs",
        "ControlPhraseMatcher.cs",
        "RequestConstraintTokenMatcher.cs",
        "RequestConstraintClassifier.cs",
        "ArchitectureRequestBriefGroundingRules.cs",
        "DecisioningTextTokenMatcher.cs",
        "EnglishNegationTokenizer.cs",
    ];

    [Fact]
    public void Production_sources_do_not_use_raw_contains_on_guarded_control_phrases()
    {
        string repoRoot = FindRepositoryRoot();
        List<string> violations = [];

        foreach (string relativeRoot in ScanRelativeRoots)
        {
            string absoluteRoot = Path.Combine(repoRoot, relativeRoot);

            if (!Directory.Exists(absoluteRoot))
                continue;

            foreach (string filePath in Directory.EnumerateFiles(absoluteRoot, "*.cs", SearchOption.AllDirectories))
            {
                string relativePath = Path.GetRelativePath(repoRoot, filePath).Replace('\\', '/');

                if (IsAllowedPath(relativePath))
                    continue;

                string source = File.ReadAllText(filePath);

                foreach (string phrase in ControlPhraseCatalog.RawMatchGuardPhrases)
                {
                    if (ContainsRawPhraseProbe(source, phrase))
                        violations.Add($"{relativePath}: raw match probe for '{phrase}'");
                }
            }
        }

        violations.Should().BeEmpty("route control phrase matching through ControlPhraseMatcher: " + string.Join(", ", violations));
    }

    private static bool ContainsRawPhraseProbe(string source, string phrase)
    {
        string escaped = Regex.Escape(phrase);

        foreach (Match match in Regex.Matches(
                     source,
                     $@"(\w+)\.Contains\s*\(\s*""{escaped}""",
                     RegexOptions.IgnoreCase))
        {

            if (IsCollectionMembershipReceiver(match.Groups[1].Value))
                continue;

            return true;
        }

        if (Regex.IsMatch(source, $@"\.IndexOf\s*\(\s*""{escaped}""", RegexOptions.IgnoreCase))
            return true;

        return Regex.IsMatch(
            source,
            $@"new\s+Regex\s*\(\s*@?""[^""]*{escaped}",
            RegexOptions.IgnoreCase);
    }

    private static bool IsCollectionMembershipReceiver(string receiver) =>
        receiver.Contains("control", StringComparison.OrdinalIgnoreCase)
        || receiver.Contains("tag", StringComparison.OrdinalIgnoreCase)
        || receiver.Contains("capabilit", StringComparison.OrdinalIgnoreCase)
        || receiver.EndsWith("Ids", StringComparison.Ordinal);

    private static bool IsAllowedPath(string relativePath)
    {
        if (relativePath.Contains("/Templates/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (relativePath.EndsWith(".Tests.cs", StringComparison.OrdinalIgnoreCase))
            return true;

        foreach (string allowed in AllowedRelativePathFragments)
        {
            if (relativePath.EndsWith(allowed, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string FindRepositoryRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null)
        {

            if (Directory.Exists(Path.Combine(directory.FullName, ".git")))
                return directory.FullName;

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Repository root not found from test base directory.");
    }
}
