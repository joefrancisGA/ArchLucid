namespace ArchLucid.Core.Safety;

/// <summary>
///     Azure text analysis uses a four-level severity scale (0, 2, 4, 6). Configured block thresholds outside that
///     set can leave intermediate severities allowed (for example threshold 5 still allows severity 4).
/// </summary>
public static class ContentSafetyBlockSeverityThreshold
{
    private static ReadOnlySpan<int> StandardLevels => [0, 2, 4, 6];

    /// <summary>
    ///     Floors a configured threshold to the greatest standard severity level that does not exceed it so blocking
    ///     never becomes looser than the operator's numeric intent.
    /// </summary>
    public static int Normalize(int configuredThreshold)
    {
        int normalized = StandardLevels[0];

        foreach (int level in StandardLevels)
        {
            if (level > configuredThreshold)
                break;

            normalized = level;
        }

        return normalized;
    }
}
