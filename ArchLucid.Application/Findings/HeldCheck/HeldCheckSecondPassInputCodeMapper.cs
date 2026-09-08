using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.HeldCheck;

/// <summary>Maps inventory ingest surfaces to held-check input codes (DX-60).</summary>
public static class HeldCheckSecondPassInputCodeMapper
{
    public static HeldCheckInputCode FromCloudProvider(CloudProvider cloudProvider)
    {
        return cloudProvider switch
        {
            CloudProvider.Aws => HeldCheckInputCode.AwsInventoryZip,
            CloudProvider.Gcp => HeldCheckInputCode.GcpInventoryZip,
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Unsupported cloud provider."),
        };
    }

    public static string ProviderFor(HeldCheckInputCode inputCode)
    {
        return inputCode switch
        {
            HeldCheckInputCode.AzureInventoryZip => RunEvidencePackagePinService.AzureProvider,
            HeldCheckInputCode.AwsInventoryZip => RunEvidencePackagePinService.AwsProvider,
            HeldCheckInputCode.GcpInventoryZip => RunEvidencePackagePinService.GcpProvider,
            _ => throw new ArgumentOutOfRangeException(nameof(inputCode), inputCode, "Not an inventory ZIP held-check code."),
        };
    }
}
