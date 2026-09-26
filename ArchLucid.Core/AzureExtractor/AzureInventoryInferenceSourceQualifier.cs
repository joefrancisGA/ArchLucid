namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Splits composite inventory inference sources (base + diagram qualifier) without depending on KnowledgeGraph.
/// </summary>
public static class AzureInventoryInferenceSourceQualifier
{
    public const char Separator = ':';

    public static bool TryGetBaseSource(string? inferenceSource, out string baseSource)
    {
        baseSource = inferenceSource ?? string.Empty;

        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        int separatorIndex = inferenceSource.IndexOf(Separator);

        if (separatorIndex <= 0 || separatorIndex >= inferenceSource.Length - 1)
        {
            baseSource = inferenceSource.Trim();

            return false;
        }

        baseSource = inferenceSource[..separatorIndex].Trim();

        return !string.IsNullOrWhiteSpace(baseSource);
    }
}
