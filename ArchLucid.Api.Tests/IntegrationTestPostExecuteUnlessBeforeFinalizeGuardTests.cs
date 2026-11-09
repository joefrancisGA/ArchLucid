using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests that call finalize after execute must refresh κ pins via
///     <see cref="IntegrationTestRunLifecycleSupport.PostExecuteAndEnsureArchitectureVersionPinForTestAsync" />
///     or <see cref="IntegrationTestRunLifecycleSupport.CreateFinalizedRunForTestAsync" /> — not
///     <see cref="IntegrationTestRunLifecycleSupport.PostExecuteUnlessAuthorityPipelineCompleteAsync" />.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestPostExecuteUnlessBeforeFinalizeGuardTests
{
    private const int FinalizeProximityLineWindow = 30;

    private static readonly Regex PostExecuteUnlessRegex = new(
        @"\.PostExecuteUnlessAuthorityPipelineCompleteAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex FinalizeFollowUpRegex = new(
        @"\.PostFinalizeForTestAsync\s*\(|\.FinalizeRunAsync\s*\(|CreateFinalizeReviewRequest\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly HashSet<string> AllowlistedFiles = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestPostExecuteUnlessBeforeFinalizeGuardTests) + ".cs",
    };

    [Fact]
    public void Api_test_sources_do_not_pair_post_execute_unless_with_finalize_setup()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (AllowlistedFiles.Contains(fileName))
                continue;

            string[] lines = File.ReadAllLines(path);

            for (int i = 0; i < lines.Length; i++)
            {
                if (!PostExecuteUnlessRegex.IsMatch(lines[i]))
                    continue;

                int end = Math.Min(lines.Length - 1, i + FinalizeProximityLineWindow);

                for (int j = i + 1; j <= end; j++)
                {
                    if (!FinalizeFollowUpRegex.IsMatch(lines[j]))
                        continue;

                    violations.Add(
                        $"{path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal)}:{i + 1}");

                    break;
                }
            }
        }

        violations.Should().BeEmpty(
            "use PostExecuteAndEnsureArchitectureVersionPinForTestAsync, PostExecuteWithPinsAsync, or CreateFinalizedRunAsync before finalize helpers.");
    }
}
