namespace ArchLucid.Api.Tests;

/// <summary>
///     Opt-in gate for InMemory Ask/Retrieval slow-slice integration tests. CI runs the warn-only slow shard without
///     setting <c>ARCHLUCID_ASK_INTEGRATION_ENABLED=1</c> so cold-boot hangs do not consume ~80 minutes per run.
/// </summary>
internal static class InMemoryAskRetrievalIntegrationGate
{
    internal static bool IsEnabled =>
        string.Equals(
            Environment.GetEnvironmentVariable("ARCHLUCID_ASK_INTEGRATION_ENABLED"),
            "1",
            StringComparison.Ordinal);

    internal static void SkipUnlessEnabled()
    {
        Skip.IfNot(
            IsEnabled,
            "InMemory Ask/Retrieval integration tests require ARCHLUCID_ASK_INTEGRATION_ENABLED=1.");
    }
}
