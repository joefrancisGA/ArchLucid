namespace ArchLucid.Application.Analysis;

public static class ComparisonTypeNormalizer
{
    public static string NormalizeForLookup(string comparisonType) =>
        string.IsNullOrWhiteSpace(comparisonType) ? comparisonType : comparisonType.Trim();
}
