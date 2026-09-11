using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>
///     Existential-assumption finalize copy: UI scorecard and
///     <see cref="FinalizeAssumptionGateEvaluator" /> must stay aligned.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExistentialAssumptionBlockedReasonUiCopyParityTests
{
    private static readonly string UiScorecardSource = File.ReadAllText(
        Path.Combine(
            ResolveRepositoryRoot(),
            "archlucid-ui",
            "src",
            "lib",
            "review-quality",
            "finalize-quality-scorecard.ts"));

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public void Server_blocked_reason_matches_ui_scorecard_copy(int count)
    {
        ArchitectureRequest request = new()
        {
            Assumptions = BuildExistentialAssumptions(count),
        };

        IReadOnlyList<string> serverReasons = FinalizeAssumptionGateEvaluator.GetBlockingReasons(
            request,
            new FindingsSnapshot(),
            acknowledgedAssumptionIds: null);

        serverReasons.Should().ContainSingle();
        serverReasons[0].Should().Be(RenderUiReason(count));
    }

    private static List<string> BuildExistentialAssumptions(int count)
    {
        List<string> assumptions = [];

        for (int index = 0; index < count; index++)
        {
            assumptions.Add($"Assumption about regulated data class {index + 1}");
        }

        return assumptions;
    }

    private static string RenderUiReason(int count)
    {
        Match block = Regex.Match(
            UiScorecardSource,
            @"if \(input\.unacknowledgedExistentialAssumptionCount > 0\) \{(?<body>.*?)\n  \}",
            RegexOptions.Singleline | RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        block.Success.Should().BeTrue("finalize-quality-scorecard.ts must gate on unacknowledgedExistentialAssumptionCount");

        Match template = Regex.Match(
            block.Groups["body"].Value,
            "`(?<template>[^`]*)`",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        template.Success.Should().BeTrue("existential assumption block must push a template literal");

        Match noun = Regex.Match(
            block.Groups["body"].Value,
            @"const noun =\s*input\.unacknowledgedExistentialAssumptionCount === 1 \? ""(?<singular>[^""]+)"" : ""(?<plural>[^""]+)"";",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        noun.Success.Should().BeTrue("existential assumption block must declare noun");

        string rendered = template.Groups["template"].Value
            .Replace("${input.unacknowledgedExistentialAssumptionCount}", count.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal)
            .Replace("${noun}", count == 1 ? noun.Groups["singular"].Value : noun.Groups["plural"].Value, StringComparison.Ordinal);

        rendered.Should().NotContain("${");

        return rendered;
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
