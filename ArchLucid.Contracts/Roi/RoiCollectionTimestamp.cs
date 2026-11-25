namespace ArchLucid.Contracts.Roi;

/// <summary>Normalizes ROI evidence timestamps whose storage contract is UTC.</summary>
public static class RoiCollectionTimestamp
{
    /// <summary>Treats an offset-free timestamp as UTC without shifting its clock value.</summary>
    public static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
    };
}
