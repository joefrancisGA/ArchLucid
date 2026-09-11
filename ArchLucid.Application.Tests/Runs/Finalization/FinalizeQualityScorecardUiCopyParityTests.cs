using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>
///     Item 7 of the review-quality plan: the API must reject with the same words the Finalize button shows.
///     Renders the template literals in <c>archlucid-ui/src/lib/review-quality/finalize-quality-scorecard.ts</c>
///     for counts 1 and 2 and compares them to <see cref="FinalizeQualityScorecardBlockedReasonFormatter" />.
///     A copy edit on either side fails here instead of drifting silently.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FinalizeQualityScorecardUiCopyParityTests
{
    private static readonly string UiScorecardSource = File.ReadAllText(
        Path.Combine(
            ResolveRepositoryRoot(),
            "archlucid-ui",
            "src",
            "lib",
            "review-quality",
            "finalize-quality-scorecard.ts"));

    private static readonly Regex PluralSuffixRegex = new(
        @"\$\{input\.(?<field>\w+) === 1 \? """" : ""s""\}",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromSeconds(1));

    private static readonly Regex CountRegex = new(
        @"\$\{input\.(?<field>\w+)\}",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromSeconds(1));

    public static TheoryData<string, Func<int, string>> ScorecardReasons => new()
    {
        { "uncoveredMandatoryRequirementCount", FinalizeQualityScorecardBlockedReasonFormatter.UncoveredMandatoryRequirements },
        { "openCannotDetermineCount", FinalizeQualityScorecardBlockedReasonFormatter.OpenCannotDetermine },
        { "openVerifyHypothesisCount", FinalizeQualityScorecardBlockedReasonFormatter.OpenVerifyHypotheses },
        { "unverifiedAssumptionCount", FinalizeQualityScorecardBlockedReasonFormatter.UnverifiedAssumptions },
        { "lowExtractionConfidenceCount", FinalizeQualityScorecardBlockedReasonFormatter.LowExtractionConfidence },
        { "unresolvedHighSeverityDispositionCount", FinalizeQualityScorecardBlockedReasonFormatter.UnresolvedHighSeverityDispositions },
    };

    [Theory]
    [MemberData(nameof(ScorecardReasons))]
    public void Server_blocked_reason_matches_ui_scorecard_copy_for_singular_and_plural(
        string uiField,
        Func<int, string> serverFormatter)
    {
        foreach (int count in new[] { 1, 2, 3 })
        {
            string rendered = RenderUiReason(uiField, count);

            serverFormatter(count).Should().Be(rendered, $"UI field {uiField} with count {count}");
        }
    }

    [Fact]
    public void Ui_unverified_assumption_threshold_matches_server_default()
    {
        UiScorecardSource.Should().Contain(
            $"if (input.unverifiedAssumptionCount >= {FinalizeQualityGateOptions.DefaultUnverifiedAssumptionBlockThreshold})",
            "the UI hard-codes the assumption threshold the server exposes as the option default");
    }

    /// <summary>
    ///     Finds the <c>if (input.{field} …) { … blockingReasons.push(`…`) }</c> block, then substitutes the
    ///     three template forms the scorecard uses: a bare count, an inline plural suffix, and a local
    ///     <c>const noun = … ? "a" : "b"</c> declared inside the same block.
    /// </summary>
    private static string RenderUiReason(string field, int count)
    {
        Match block = Regex.Match(
            UiScorecardSource,
            @"if \(input\." + Regex.Escape(field) + @"[^)]*\) \{(?<body>.*?)\n  \}",
            RegexOptions.Singleline | RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        block.Success.Should().BeTrue($"finalize-quality-scorecard.ts must gate on input.{field}");

        string body = block.Groups["body"].Value;
        Match template = Regex.Match(body, "`(?<template>[^`]*)`", RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1));

        template.Success.Should().BeTrue($"input.{field} block must push a template literal");

        string rendered = PluralSuffixRegex.Replace(template.Groups["template"].Value, _ => count == 1 ? string.Empty : "s");
        rendered = CountRegex.Replace(rendered, _ => count.ToString(CultureInfo.InvariantCulture));

        Match noun = Regex.Match(
            body,
            @"const noun =\s*input\.\w+ === 1 \? ""(?<singular>[^""]+)"" : ""(?<plural>[^""]+)"";",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        if (noun.Success)
            rendered = rendered.Replace("${noun}", count == 1 ? noun.Groups["singular"].Value : noun.Groups["plural"].Value, StringComparison.Ordinal);

        rendered = Regex.Replace(
            rendered,
            @"\$\{input\." + Regex.Escape(field) + @" === 1 \? ""(?<singular>[^""]+)"" : ""(?<plural>[^""]+)""\}",
            match => count == 1 ? match.Groups["singular"].Value : match.Groups["plural"].Value,
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        rendered.Should().NotContain("${", $"every template placeholder for input.{field} must be rendered");

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
