using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Agentic;

/// <summary>Deterministic fallbacks for agentic retrieval when LLM transforms fail.</summary>
public static class AgenticRetrievalHeuristics
{
    public static string RewriteQuery(string queryText)
    {
        string trimmed = queryText.Trim();

        if (trimmed.Contains("architecture", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        return $"{trimmed} — enterprise architecture review context";
    }

    public static string GenerateHydeDocument(string queryText)
    {
        return
            "Hypothetical architecture review finding document. "
            + "It cites policy packs, topology resources, and evidence-backed recommendations for: "
            + queryText.Trim();
    }

    public static RetrievalCritiqueVerdict CritiqueRetrieval(string queryText, IReadOnlyList<RetrievalHit> hits)
    {
        if (hits.Count >= 2)
        {
            return new RetrievalCritiqueVerdict { IsSufficient = true };
        }

        string trimmed = queryText.Trim();

        return new RetrievalCritiqueVerdict
        {
            IsSufficient = false,
            RefinedQueryText = $"{trimmed} — additional architecture evidence",
        };
    }
}
