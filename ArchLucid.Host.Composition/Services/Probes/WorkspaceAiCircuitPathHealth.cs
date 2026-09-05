namespace ArchLucid.Host.Composition.Services.Probes;

/// <summary>
///     Whether managed-platform reviews can start given circuit-breaker state.
///     Primary completion Open is not blocking when a same-family fallback gate is registered and not Open.
/// </summary>
internal static class WorkspaceAiCircuitPathHealth
{
    internal static bool IsReviewPathUsable(
        bool primaryCompletionOpen,
        bool fallbackGateRegistered,
        bool fallbackCompletionOpen,
        bool embeddingGateRegistered,
        bool embeddingOpen)
    {
        if (!IsCompletionPathUsable(primaryCompletionOpen, fallbackGateRegistered, fallbackCompletionOpen))
            return false;

        return IsEmbeddingPathUsable(embeddingGateRegistered, embeddingOpen);
    }

    internal static bool IsCompletionPathUsable(
        bool primaryCompletionOpen,
        bool fallbackGateRegistered,
        bool fallbackCompletionOpen)
    {
        if (!primaryCompletionOpen)
            return true;

        if (!fallbackGateRegistered)
            return false;

        return !fallbackCompletionOpen;
    }

    internal static bool IsEmbeddingPathUsable(bool embeddingGateRegistered, bool embeddingOpen)
    {
        if (!embeddingGateRegistered)
            return true;

        return !embeddingOpen;
    }
}
