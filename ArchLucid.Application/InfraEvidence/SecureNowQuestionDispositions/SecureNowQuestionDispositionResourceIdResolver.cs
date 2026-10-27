using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

internal static class SecureNowQuestionDispositionResourceIdResolver
{
    internal static string Resolve(
        string subscriptionId,
        string? resourceId,
        SecureNowQuestionScopeKind scopeKind)
    {
        if (!string.IsNullOrWhiteSpace(resourceId))
            return Normalize(resourceId);

        if (scopeKind is SecureNowQuestionScopeKind.Subscription
            or SecureNowQuestionScopeKind.ResourceGroup)
            return Normalize(subscriptionId);

        return Normalize(resourceId);
    }

    /// <summary>
    /// Reopen requests omit <see cref="SecureNowQuestionScopeKind"/>; empty listed resource ids use subscription disposition identity.
    /// </summary>
    internal static string ResolveForReopen(string subscriptionId, string? resourceId) =>
        Resolve(
            subscriptionId,
            resourceId,
            string.IsNullOrWhiteSpace(resourceId)
                ? SecureNowQuestionScopeKind.Subscription
                : SecureNowQuestionScopeKind.Resource);

    private static string Normalize(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;
}
