namespace ArchLucid.Core.Requests;

/// <summary>
///     Canonical free-text tokens for security and architecture control phrase matching.
///     Production heuristics must use <see cref="ControlPhraseMatcher" /> — not raw
///     <c>string.Contains</c> on these literals.
/// </summary>
public static class ControlPhraseCatalog
{
    public const string ManagedIdentity = "managed identity";

    public const string PrivateEndpoint = "private endpoint";

    public const string PrivateEndpoints = "private endpoints";

    public const string PrivateNetworking = "private networking";

    public const string Encryption = "encryption";

    public const string Security = "security";

    public const string Cost = "cost";

    public const string Reliability = "reliability";

    /// <summary>Phrases guarded by <c>ControlPhraseRawMatchingArchitectureTests</c>.</summary>
    public static IReadOnlyList<string> RawMatchGuardPhrases { get; } =
    [
        ManagedIdentity,
        PrivateEndpoint,
        PrivateEndpoints,
        PrivateNetworking,
        Encryption,
        Security,
        Cost,
        Reliability,
    ];
}
