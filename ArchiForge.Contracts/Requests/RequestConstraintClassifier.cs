namespace ArchiForge.Contracts.Requests;

/// <summary>
/// Centralises free-text constraint and capability matching rules so that
/// <c>CoordinatorService</c> and <c>DefaultEvidenceBuilder</c> (and any future
/// callers) apply identical heuristics.
/// </summary>
public static class RequestConstraintClassifier
{
    public static bool HasManagedIdentityConstraint(ArchitectureRequest request) =>
        request.Constraints.Any(c =>
            c.Contains("managed identity", StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Returns <see langword="true"/> when any constraint mentions private endpoints,
    /// private networking, or the generic word "private" (superset of the narrower checks).
    /// </summary>
    public static bool HasPrivateNetworkingConstraint(ArchitectureRequest request) =>
        request.Constraints.Any(c =>
            c.Contains("private endpoint", StringComparison.OrdinalIgnoreCase) ||
            c.Contains("private networking", StringComparison.OrdinalIgnoreCase) ||
            c.Contains("private", StringComparison.OrdinalIgnoreCase));

    public static bool HasEncryptionConstraint(ArchitectureRequest request) =>
        request.Constraints.Any(c =>
            c.Contains("encryption", StringComparison.OrdinalIgnoreCase));

    public static bool RequiresSearchCapability(ArchitectureRequest request) =>
        request.RequiredCapabilities.Any(c =>
            c.Contains("search", StringComparison.OrdinalIgnoreCase));

    public static bool RequiresAiCapability(ArchitectureRequest request) =>
        request.RequiredCapabilities.Any(c =>
            c.Contains("openai", StringComparison.OrdinalIgnoreCase) ||
            c.Contains("ai", StringComparison.OrdinalIgnoreCase));

    public static bool RequiresSqlCapability(ArchitectureRequest request) =>
        request.RequiredCapabilities.Any(c =>
            c.Contains("sql", StringComparison.OrdinalIgnoreCase));
}
