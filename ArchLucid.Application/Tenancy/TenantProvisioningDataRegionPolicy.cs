using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>Parses and validates residency keys on provisioning requests.</summary>
internal static class TenantProvisioningDataRegionPolicy
{
    public static string NormalizeRequest(string? dataRegion) => TenantDataRegions.NormalizeOptional(dataRegion);

    public static void Validate(string normalizedRegion, TenantProvisioningOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        IReadOnlyList<string> supported = ResolveEffectiveSupported(options.SupportedDataRegions);

        foreach (string entry in supported)
        {
            if (string.Equals(entry, normalizedRegion, StringComparison.Ordinal))
                return;
        }

        throw new ArgumentException(
            $"Data region '{normalizedRegion}' is not in the supported list ({string.Join(", ", supported)}).",
            nameof(TenantProvisioningRequest.DataRegion));
    }

    private static IReadOnlyList<string> ResolveEffectiveSupported(IList<string>? configured)
    {
        if (configured is null || configured.Count == 0)
            return TenantDataRegions.PlatformDefaultSupportedRegions;

        List<string>? cleaned = [];

        foreach (string row in configured)
        {
            if (string.IsNullOrWhiteSpace(row))
                continue;

            cleaned.Add(TenantDataRegions.Normalize(row));
        }

        if (cleaned.Count == 0)
            return TenantDataRegions.PlatformDefaultSupportedRegions;

        return cleaned;
    }
}
