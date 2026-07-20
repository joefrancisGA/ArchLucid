namespace ArchLucid.Application.Architecture;

/// <summary>Conservative Quick Scan input token estimation (chars/4 heuristic).</summary>
public static class QuickScanInputTokenEstimator
{
    private const int CharsPerTokenEstimate = 4;

    private const int OrchestrationOverheadTokens = 32;

    public static int EstimateTokens(string systemPrompt, string userPayload)
    {
        int systemChars = systemPrompt?.Length ?? 0;
        int userChars = userPayload?.Length ?? 0;
        int totalChars = systemChars + userChars;

        if (totalChars <= 0)
        {
            return OrchestrationOverheadTokens;
        }

        int estimated = (int)Math.Ceiling(totalChars / (double)CharsPerTokenEstimate) + OrchestrationOverheadTokens;

        return Math.Max(estimated, OrchestrationOverheadTokens);
    }
}
