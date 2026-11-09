using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Greenfield SQL create must use <see cref="IntegrationTestRunLifecycleSupport.PostGreenfieldArchitectureRequestForTestAsync" />.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestPrivateIntakeWrapperGuardTests
{
    private static readonly Regex PrivateGreenfieldIntakeWrapperRegex = new(
        @"private\s+static\s+Task<HttpResponseMessage>\s+PostArchitectureRequestAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Api_test_sources_do_not_define_private_PostArchitectureRequestAsync_wrappers()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources(
                     nameof(IntegrationTestBase) + ".cs",
                     nameof(IntegrationTestPrivateIntakeWrapperGuardTests) + ".cs"))
        {
            string content = File.ReadAllText(path);

            if (PrivateGreenfieldIntakeWrapperRegex.IsMatch(content))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        violations.Should().BeEmpty(
            "use client.PostGreenfieldArchitectureRequestForTestAsync(body, idempotencyKeyPrefix) instead of duplicating greenfield intake helpers.");
    }
}
