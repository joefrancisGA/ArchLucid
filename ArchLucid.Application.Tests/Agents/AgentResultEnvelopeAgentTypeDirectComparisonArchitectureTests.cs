using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class AgentResultEnvelopeAgentTypeDirectComparisonArchitectureTests
{
    private static readonly Regex EnvelopeAgentTypeRead = new(
        @"\b(result|r|source|row)\.AgentType\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly HashSet<string> AllowlistedRelativePaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "ArchLucid.Application/Agents/AgentResultEnvelopeAgentTypeResolver.cs",
    };

    private static readonly HashSet<string> AllowlistedLineSnippets = new(StringComparer.OrdinalIgnoreCase)
    {
        // Resolver implementation is the only place that may read or backfill the stored envelope field.
    };

    [Fact]
    public void Application_and_agents_code_routes_envelope_agent_type_through_resolver()
    {
        string repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        string applicationRoot = Path.Combine(repoRoot, "ArchLucid.Application");
        Directory.Exists(applicationRoot).Should().BeTrue();

        List<string> violations = [];

        foreach (string absolutePath in Directory.EnumerateFiles(applicationRoot, "*.cs", SearchOption.AllDirectories))
        {
            string relativePath = Path.GetRelativePath(repoRoot, absolutePath).Replace('\\', '/');

            if (AllowlistedRelativePaths.Contains(relativePath))
                continue;

            string[] lines = File.ReadAllLines(absolutePath);

            for (int lineIndex = 0; lineIndex < lines.Length; lineIndex++)
            {
                string line = lines[lineIndex];

                if (!EnvelopeAgentTypeRead.IsMatch(line))
                    continue;

                if (AllowlistedLineSnippets.Any(snippet => line.Contains(snippet, StringComparison.Ordinal)))
                    continue;

                if (line.Contains("AgentResultEnvelopeAgentTypeResolver", StringComparison.Ordinal))
                    continue;

                violations.Add($"{relativePath}:{lineIndex + 1}: {line.Trim()}");
            }
        }

        violations.Should().BeEmpty(
            "AgentResult envelope AgentType must be resolved via AgentResultEnvelopeAgentTypeResolver "
            + "(add an allowlist entry only for legitimate persistence of the raw stored field).");
    }
}
