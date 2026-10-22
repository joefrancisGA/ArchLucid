using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>RC29 package-coverage batch: agentic heuristics, token budget truncation, EA multiplier, embedding hash.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc29Tests
{
    [Fact]
    public void AgenticRetrievalHeuristics_rewrite_appends_architecture_context_when_missing()
    {
        string rewritten = AgenticRetrievalHeuristics.RewriteQuery("cost overrun");

        rewritten.Should().Contain("enterprise architecture review context");
    }

    [Fact]
    public void AgenticRetrievalHeuristics_rewrite_preserves_architecture_queries()
    {
        string rewritten = AgenticRetrievalHeuristics.RewriteQuery("cloud architecture topology");

        rewritten.Should().Be("cloud architecture topology");
    }

    [Fact]
    public void AgenticRetrievalHeuristics_generate_hyde_document_includes_query()
    {
        string doc = AgenticRetrievalHeuristics.GenerateHydeDocument("private endpoints");

        doc.Should().Contain("private endpoints");
        doc.Should().Contain("Hypothetical architecture review finding document");
    }

    [Fact]
    public void TenantEaDiscountMultiplierNormalizer_clamps_null_and_non_positive_values()
    {
        TenantEaDiscountMultiplierNormalizer.Normalize(null).Should().Be(1.0m);
        TenantEaDiscountMultiplierNormalizer.Normalize(-1m).Should().Be(1.0m);
        TenantEaDiscountMultiplierNormalizer.Normalize(0m).Should().Be(1.0m);
    }

    [Fact]
    public void TenantEaDiscountMultiplierNormalizer_clamps_values_above_one()
    {
        TenantEaDiscountMultiplierNormalizer.Normalize(1.5m).Should().Be(1.0m);
    }

    [Fact]
    public void TenantEaDiscountMultiplierNormalizer_returns_raw_when_in_range()
    {
        TenantEaDiscountMultiplierNormalizer.Normalize(0.85m).Should().Be(0.85m);
    }

    [Fact]
    public void TokenAwareContextBudget_truncates_when_estimate_exceeds_budget()
    {
        string text = new('x', 500);
        string truncated = TokenAwareContextBudget.TruncateToTokenBudget(
            text,
            out bool wasTruncated,
            maxEstimatedTokens: 10,
            charsPerToken: 4);

        wasTruncated.Should().BeTrue();
        truncated.Should().Contain("Context truncated");
        truncated.Length.Should().BeLessThan(text.Length);
    }

    [Fact]
    public void EmbeddingTextContentHasher_normalizes_newlines_before_hashing()
    {
        string hashA = EmbeddingTextContentHasher.Sha256HexUtf8Normalized("line1\r\nline2");
        string hashB = EmbeddingTextContentHasher.Sha256HexUtf8Normalized("line1\nline2");

        hashA.Should().Be(hashB);
        hashA.Should().MatchRegex("^[0-9a-f]{64}$");
    }
}
