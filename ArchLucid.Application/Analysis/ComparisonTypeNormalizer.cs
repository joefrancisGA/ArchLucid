namespace ArchLucid.Application.Analysis;

public static class ComparisonTypeNormalizer
{
    public static string NormalizeForLookup(string comparisonType) =>
        string.IsNullOrWhiteSpace(comparisonType) ? string.Empty : comparisonType.Trim();
}
