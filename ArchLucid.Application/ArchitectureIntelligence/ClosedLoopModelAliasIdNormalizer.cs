namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopModelAliasIdNormalizer
{
    public static string NormalizeRequired(string modelAliasId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(modelAliasId);

        return modelAliasId.Trim();
    }

    public static string? NormalizeOptional(string? modelAliasId)
    {
        if (string.IsNullOrWhiteSpace(modelAliasId))
            return null;

        return modelAliasId.Trim();
    }

    public static string NormalizeForHash(string? modelAliasId)
    {
        if (string.IsNullOrWhiteSpace(modelAliasId))
            return string.Empty;

        return modelAliasId.Trim();
    }
}
