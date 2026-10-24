namespace ArchLucid.Application.Analysis;

public static class ComparisonRecordIdNormalizer
{
    public static string NormalizeRequired(string comparisonRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);
        return comparisonRecordId.Trim();
    }
}
