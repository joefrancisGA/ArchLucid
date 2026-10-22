namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized federated credential row aligned with <c>federated-credentials.json</c> companion entries.
/// </summary>
public sealed record HostedAzureArmFederatedCredentialRecord(
    string Issuer,
    string Subject,
    string PrincipalId,
    string? AppId,
    string? ParentResourceId,
    string? CredentialName);
