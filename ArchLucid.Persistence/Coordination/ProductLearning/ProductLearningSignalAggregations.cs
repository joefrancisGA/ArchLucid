namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <summary>
///     Deterministic grouping rules shared by the in-memory repository and documented to match SQL in
///     <see cref="DapperProductLearningPilotSignalRepository" />.
/// </summary>
public static partial class ProductLearningSignalAggregations
{
    public const int CommentThemePrefixLength = 200;

    private static string TruncateHint(string value, int maxChars)
    {
        return value.Length <= maxChars ? value : value[..maxChars];
    }
}
