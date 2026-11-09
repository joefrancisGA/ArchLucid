using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Api integration tests must call review replay through <see cref="IntegrationTestRunLifecycleSupport" /> helpers.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestRawReviewReplayUrlGuardTests
{
    private static readonly Regex RawReviewReplayPostRegex = new(
        @"\.PostAsync\s*\(\s*\$""/v1/architecture/review/\{[^""]+\}/replay""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawReviewReplayRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*\$""/v1/architecture/review/\{[^""]+\}/replay""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Api_test_sources_do_not_embed_raw_review_replay_urls()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources(
                     nameof(IntegrationTestRunLifecycleSupport) + ".cs",
                     nameof(IntegrationTestRawReviewReplayUrlGuardTests) + ".cs"))
        {
            string content = File.ReadAllText(path);

            if (RawReviewReplayPostRegex.IsMatch(content) || RawReviewReplayRequestRegex.IsMatch(content))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        violations.Should().BeEmpty(
            "use PostReviewReplayForTestAsync, ReplayReviewRelativeUrl, or CreateReviewReplayRequest instead of embedding the review replay path.");
    }
}
