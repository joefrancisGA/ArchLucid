namespace ArchLucid.Core.InfraEvidence;

/// <summary>How an Azure inventory snapshot was collected.</summary>
public enum AzureInventoryCaptureMethod
{
    Unknown = 0,
    CustomerScript = 1,
    HostedReader = 2,
}
