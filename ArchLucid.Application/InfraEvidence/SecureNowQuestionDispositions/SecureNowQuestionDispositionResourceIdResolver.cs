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

    private static string Normalize(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;
}
