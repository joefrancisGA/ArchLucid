using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

internal static class SecureNowPackQuestionScopeKindResolver
{
    internal static SecureNowQuestionScopeKind ResolveFromPrompt(string prompt)
    {
        if (prompt.Contains("resource group", StringComparison.OrdinalIgnoreCase))
            return SecureNowQuestionScopeKind.ResourceGroup;

        return SecureNowQuestionScopeKind.Subscription;
    }
}
