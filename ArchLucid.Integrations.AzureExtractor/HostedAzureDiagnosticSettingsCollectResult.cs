namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Diagnostic-settings collection outcome for hosted Tier 2 packages (AX-DE-10).
/// </summary>
public sealed class HostedAzureDiagnosticSettingsCollectResult
{
    public IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> Settings
    {
        get;
        init;
    } = [];

    public bool PartialCollection
    {
        get;
        init;
    }
}
