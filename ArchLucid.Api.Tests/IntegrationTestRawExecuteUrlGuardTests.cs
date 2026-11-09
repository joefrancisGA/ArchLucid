using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Api integration tests must call execute through <see cref="IntegrationTestRunLifecycleSupport" /> helpers
///     so authority-pipeline 409 handling stays consistent.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestRawExecuteUrlGuardTests
{
    private static readonly Regex RawExecutePostRegex = new(
        @"\.PostAsync\s*\(\s*\$""/v1/architecture/review/\{[^""]+\}/execute""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawExecuteRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*\$""/v1/architecture/review/\{[^""]+\}/execute""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Api_test_sources_do_not_embed_raw_execute_urls()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources(
                     nameof(IntegrationTestRunLifecycleSupport) + ".cs",
                     nameof(IntegrationTestRawExecuteUrlGuardTests) + ".cs"))
        {
            string content = File.ReadAllText(path);

            if (RawExecutePostRegex.IsMatch(content) || RawExecuteRequestRegex.IsMatch(content))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        violations.Should().BeEmpty(
            "use PostExecuteForTestAsync, ExecuteReviewRelativeUrl, or CreateExecuteReviewRequest instead of embedding the execute path.");
    }
}
