using ArchLucid.AgentRuntime.Evaluation;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EmbeddingFaithfulnessIndependentOracleTests
{
    [Fact]
    public void Cosine_matches_worked_three_four_five_triangle_and_preserves_sign()
    {
        // Dot with the horizontal unit vector is ±3 and the norm is 5.
        Assert.Equal(3.0 / 5.0, EmbeddingFaithfulnessVectorMath.CosineSimilarity([3f, 4f], [1f, 0f]), 12);
        Assert.Equal(-3.0 / 5.0, EmbeddingFaithfulnessVectorMath.CosineSimilarity([-3f, 4f], [1f, 0f]), 12);
        Assert.Equal(0d, EmbeddingFaithfulnessVectorMath.CosineSimilarity([1f, 0f], [0f, 2f]));
    }

    [Fact]
    public void Undefined_vector_pairs_use_zero_fallback()
    {
        Assert.Equal(0d, EmbeddingFaithfulnessVectorMath.CosineSimilarity([], []));
        Assert.Equal(0d, EmbeddingFaithfulnessVectorMath.CosineSimilarity([1f], [1f, 2f]));
        Assert.Equal(0d, EmbeddingFaithfulnessVectorMath.CosineSimilarity([0f, 0f], [1f, 2f]));
    }

    [Theory]
    [InlineData(-2, 0)]
    [InlineData(-1, 0)]
    [InlineData(-0.5, 0.25)]
    [InlineData(0, 0.5)]
    [InlineData(0.5, 0.75)]
    [InlineData(1, 1)]
    [InlineData(2, 1)]
    public void Telemetry_affine_mapping_matches_endpoints_midpoint_and_saturation(double input, double expected)
    {
        Assert.Equal(expected, EmbeddingFaithfulnessVectorMath.ToTelemetryUnitInterval(input));
    }
}
