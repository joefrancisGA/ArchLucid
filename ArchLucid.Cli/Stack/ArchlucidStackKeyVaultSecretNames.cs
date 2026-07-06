namespace ArchLucid.Cli.Stack;

/// <summary>Key Vault secret names referenced by hosted appsettings (names only — never values).</summary>
internal static class ArchlucidStackKeyVaultSecretNames
{
    internal static IReadOnlyList<string> HostedPilotSecrets { get; } = new[]
    {
        "archlucid-sql-connection-string",
        "archlucid-azure-openai-api-key",
        "archlucid-fallback-llm-api-key",
        "archlucid-api-admin-key",
        "archlucid-api-readonly-key",
        "archlucid-azuredevops-archlucid-api-key",
        "archlucid-servicebus-connection-string",
        "archlucid-webhook-hmac-secret",
        "archlucid-internal-cross-tenant-analytics-salt",
    };
}
