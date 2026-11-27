namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDiagnosticConfigurationWrite
{
    public string TargetAzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string DiagnosticName
    {
        get;
        init;
    } = string.Empty;

    public string? WorkspaceResourceId
    {
        get;
        init;
    }

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}
