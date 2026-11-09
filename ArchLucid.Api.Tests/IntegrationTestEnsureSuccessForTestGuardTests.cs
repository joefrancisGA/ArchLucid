using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration tests should surface response bodies on failure via <see cref="ArchLucidHttpResponseIntegrationTestExtensions.EnsureSuccessForTestAsync" />.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestEnsureSuccessForTestGuardTests
{
    private static readonly Regex EnsureSuccessStatusCodeRegex = new(
        @"\.EnsureSuccessStatusCode\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly HashSet<string> AllowlistedFiles = new(StringComparer.Ordinal)
    {
        nameof(ArchitectureRequestConcurrencyTestSupport) + ".cs",
        nameof(IntegrationTestEnsureSuccessForTestGuardTests) + ".cs",
    };

    [Fact]
    public void Api_test_sources_prefer_EnsureSuccessForTestAsync_over_EnsureSuccessStatusCode()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (AllowlistedFiles.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (EnsureSuccessStatusCodeRegex.IsMatch(content))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        violations.Should().BeEmpty(
            "use EnsureSuccessForTestAsync so CI logs include response bodies when setup HTTP calls fail.");
    }
}
