using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Api integration tests must call finalize through <see cref="IntegrationTestRunLifecycleSupport" /> helpers
///     so κ pin refresh stays aligned with production (CI SQL 409 flakes).
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestRawFinalizeUrlGuardTests
{
    private static readonly Regex RawFinalizePostRegex = new(
        @"\.PostAsync\s*\(\s*\$""/v1/architecture/review/\{[^""]+\}/finalize""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawFinalizeRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*\$""/v1/architecture/review/\{[^""]+\}/finalize""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Api_test_sources_do_not_embed_raw_finalize_urls()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources(
                     nameof(IntegrationTestRunLifecycleSupport) + ".cs",
                     nameof(IntegrationTestRawFinalizeUrlGuardTests) + ".cs"))
        {
            string content = File.ReadAllText(path);

            if (RawFinalizePostRegex.IsMatch(content) || RawFinalizeRequestRegex.IsMatch(content))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        violations.Should().BeEmpty(
            "use PostFinalizeForTestAsync, FinalizeReviewRelativeUrl, or CreateFinalizeReviewRequest instead of embedding the finalize path.");
    }
}
