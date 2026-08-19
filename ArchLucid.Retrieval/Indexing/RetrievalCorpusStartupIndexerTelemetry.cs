using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>Shared fail-open telemetry for startup corpus indexers (TB-046).</summary>
public static class RetrievalCorpusStartupIndexerTelemetry
{
    public static void RecordFailure(string corpusKind)
    {
        if (string.IsNullOrWhiteSpace(corpusKind))
            return;

        ArchLucidInstrumentation.RecordRetrievalCorpusStartupIndexerFailure(corpusKind.Trim());
    }
}
