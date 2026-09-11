namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized diagnostic setting row aligned with <c>diagnostic-settings.json</c> companion entries.
/// </summary>
public sealed record HostedAzureArmDiagnosticSettingRecord(
    string TargetResourceId,
    string Name,
    string WorkspaceId);
