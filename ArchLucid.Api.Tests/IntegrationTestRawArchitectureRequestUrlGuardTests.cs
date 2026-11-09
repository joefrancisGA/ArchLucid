using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Api integration tests must create runs through <see cref="IntegrationTestRunLifecycleSupport" /> helpers.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestRawArchitectureRequestUrlGuardTests
{
    private static readonly Regex RawArchitectureRequestPostRegex = new(
        @"\.PostAsync\s*\(\s*""/v1/architecture/request""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawArchitectureRequestHttpRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*""/v1/architecture/request""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Api_test_sources_do_not_embed_raw_architecture_request_urls()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources(
                     nameof(IntegrationTestRunLifecycleSupport) + ".cs",
                     nameof(IntegrationTestRawArchitectureRequestUrlGuardTests) + ".cs"))
        {
            string content = File.ReadAllText(path);

            if (RawArchitectureRequestPostRegex.IsMatch(content)
                || RawArchitectureRequestHttpRequestRegex.IsMatch(content))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        violations.Should().BeEmpty(
            "use PostArchitectureRequestForTestAsync, CreateArchitectureRequestMessage, CreateArchitectureRunForTestAsync, or CreateFinalizedRunAsync instead of embedding the intake path.");
    }
}
