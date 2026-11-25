using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

internal static class RoiCostEvidenceUtcNormalizer
{
    public static DateTime Normalize(DateTime value) => RoiCollectionTimestamp.NormalizeUtc(value);
}
