using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.CareerArtifacts;

/// <summary>
///     WS-14: UI <c>degraded-finding-coverage-blocked-reason.ts</c> and server
///     <see cref="CareerArtifactCompletenessValidator.FormatDegradedFindingCoverageBlockedReason" /> must stay aligned.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DegradedFindingCoverageBlockedReasonUiCopyParityTests
{
    private static readonly string UiBlockedReasonSource = File.ReadAllText(
        Path.Combine(
            ResolveRepositoryRoot(),
            "archlucid-ui",
            "src",
            "lib",
            "review-quality",
            "degraded-finding-coverage-blocked-reason.ts"));

    public static TheoryData<string[], string> LabelCases => new()
    {
        { [], "one or more finding engines" },
        { ["PolicyEngine/Security"], "PolicyEngine/Security" },
        { ["EngineA", "EngineB"], "EngineA, EngineB" },
    };

    [Theory]
    [MemberData(nameof(LabelCases))]
    public void Server_blocked_reason_matches_ui_helper_for_empty_and_populated_label_lists(
        string[] failedEngineLabels,
        string expectedJoinedLabels)
    {
        string serverReason = CareerArtifactCompletenessValidator.FormatDegradedFindingCoverageBlockedReason(
            expectedJoinedLabels);

        RenderUiBlockedReason(failedEngineLabels).Should().Be(serverReason);
    }

    private static string RenderUiBlockedReason(IReadOnlyList<string> failedEngineLabels)
    {
        Match function = Regex.Match(
            UiBlockedReasonSource,
            @"export function formatDegradedFindingCoverageBlockedReason\([\s\S]*?return `(?<template>[^`]*)`;",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        function.Success.Should().BeTrue("UI helper must return a template literal");

        string labelText = failedEngineLabels.Count > 0
            ? string.Join(", ", failedEngineLabels)
            : "one or more finding engines";

        return function.Groups["template"].Value.Replace("${labelText}", labelText, StringComparison.Ordinal);
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
