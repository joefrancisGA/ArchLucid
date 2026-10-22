using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.CareerArtifacts;

/// <summary>
///     Skipped-MUST finalize copy: UI <c>authority-commit-skipped-must-blocked-reason.ts</c> and server
///     <see cref="CareerArtifactCompletenessValidator.FormatSkippedMustBlockedReason" /> must stay aligned.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SkippedMustBlockedReasonUiCopyParityTests
{
    private static readonly string UiBlockedReasonSource = File.ReadAllText(
        Path.Combine(
            ResolveRepositoryRoot(),
            "archlucid-ui",
            "src",
            "lib",
            "review-quality",
            "authority-commit-skipped-must-blocked-reason.ts"));

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public void Server_blocked_reason_matches_ui_helper(int skippedMustCount)
    {
        CareerArtifactCompletenessValidator.FormatSkippedMustBlockedReason(skippedMustCount)
            .Should()
            .Be(RenderUiBlockedReason(skippedMustCount));
    }

    private static string RenderUiBlockedReason(int skippedMustCount)
    {
        Match function = Regex.Match(
            UiBlockedReasonSource,
            @"export function formatAuthorityCommitSkippedMustBlockedReason\([\s\S]*?return `\$\{skippedMustCount\} required \$\{noun\} unanswered\.`;",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        function.Success.Should().BeTrue("UI helper must return a template literal");

        Match nounMatch = Regex.Match(
            UiBlockedReasonSource,
            @"const noun = skippedMustCount === 1 \? ""(?<singular>[^""]+)"" : ""(?<plural>[^""]+)"";",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        nounMatch.Success.Should().BeTrue("UI helper must declare singular/plural noun");

        string noun = skippedMustCount == 1
            ? nounMatch.Groups["singular"].Value
            : nounMatch.Groups["plural"].Value;

        return $"{skippedMustCount.ToString(CultureInfo.InvariantCulture)} required {noun} unanswered.";
    }

    private static string ResolveRepositoryRoot()
    {
        string? current = Directory.GetCurrentDirectory();

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            if (File.Exists(Path.Combine(current, "ArchLucid.sln")))
                return current;

            current = Directory.GetParent(current)?.FullName;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
