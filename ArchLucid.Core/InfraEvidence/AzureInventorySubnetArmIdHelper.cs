namespace ArchLucid.Core.InfraEvidence;

public static class AzureInventorySubnetArmIdHelper
{
    public static string? TryResolveVnetArmIdFromSubnetArmId(string subnetArmId)
    {
        if (string.IsNullOrWhiteSpace(subnetArmId))
        {
            return null;
        }

        const string marker = "/subnets/";

        int subnetsIndex = subnetArmId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (subnetsIndex <= 0)
        {
            return null;
        }

        return subnetArmId[..subnetsIndex];
    }
}
