using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.Requests;

/// <summary>
///     Centralises free-text constraint and capability matching rules so that
///     <c>RunStarterTaskFactory</c>, <c>DefaultEvidenceBuilder</c>, and any future callers apply identical heuristics.
/// </summary>
public static class RequestConstraintClassifier
{
    private const string ConstraintManagedIdentity = "managed identity";
    private const string ConstraintPrivateEndpoint = "private endpoint";
    private const string ConstraintPrivateNetworking = "private networking";
    private const string ConstraintEncryption = "encryption";

    private const string CapabilitySearch = "search";
    private const string CapabilityOpenAi = "openai";
    private const string CapabilityAi = "ai";
    private const string CapabilitySql = "sql";

    public static bool HasManagedIdentityConstraint(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.Constraints.Any(c =>
            c.Contains(ConstraintManagedIdentity, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    ///     Returns <see langword="true" /> when any constraint mentions private endpoints,
    ///     private networking, or the generic word "private" (superset of the narrower checks).
    /// </summary>
    public static bool HasPrivateNetworkingConstraint(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.Constraints.Any(c =>
            RequestConstraintTokenMatcher.ContainsAffirmativePhrase(c, ConstraintPrivateEndpoint) ||
            RequestConstraintTokenMatcher.ContainsAffirmativePhrase(c, ConstraintPrivateNetworking) ||
            RequestConstraintTokenMatcher.ContainsAffirmativePrivateWord(c));
    }

    public static bool HasEncryptionConstraint(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.Constraints.Any(c =>
            RequestConstraintTokenMatcher.ContainsAffirmativePhrase(c, ConstraintEncryption));
    }

    public static bool RequiresSearchCapability(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.RequiredCapabilities.Any(c =>
            RequestConstraintTokenMatcher.ContainsStandaloneWordToken(c, CapabilitySearch));
    }

    public static bool RequiresAiCapability(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.RequiredCapabilities.Any(c =>
            RequestConstraintTokenMatcher.ContainsAffirmativePhrase(c, CapabilityOpenAi) ||
            RequestConstraintTokenMatcher.ContainsStandaloneWordToken(c, CapabilityAi));
    }

    public static bool RequiresSqlCapability(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.RequiredCapabilities.Any(c =>
            RequestConstraintTokenMatcher.ContainsStandaloneWordToken(c, CapabilitySql));
    }
}
