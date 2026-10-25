using System.Text.RegularExpressions;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Token-boundary heuristics for brief-grounding drops on topology endpoint names (not free-form prose).
/// </summary>
internal static class BriefGroundingEndpointNameHeuristics
{
    public static bool SuggestsPlainHttp(string endpointName) =>
        PlainHttpTokenInEndpointNameRegex.IsMatch(endpointName);

    public static bool SuggestsPublicExposure(string endpointName) =>
        PublicTokenInEndpointNameRegex.IsMatch(endpointName);

    public static bool SuggestsMissingEncryptionAtRest(string endpointName) =>
        PlaintextTokenInEndpointNameRegex.IsMatch(endpointName)
        || UnencryptedTokenInEndpointNameRegex.IsMatch(endpointName);

    private static readonly Regex PlainHttpTokenInEndpointNameRegex = new(
        @"\bhttp\b(?!s\b)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex PlaintextTokenInEndpointNameRegex = new(
        @"\bplaintext\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex UnencryptedTokenInEndpointNameRegex = new(
        @"\bunencrypted\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex PublicTokenInEndpointNameRegex = new(
        @"\bpublic\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);
}
