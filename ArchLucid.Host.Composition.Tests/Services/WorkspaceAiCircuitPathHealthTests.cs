using ArchLucid.Host.Composition.Services.Probes;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests.Services;

[Trait("Suite", "Core")]
public sealed class WorkspaceAiCircuitPathHealthTests
{
    [Fact]
    public void IsReviewPathUsable_primary_open_without_fallback_is_false()
    {
        WorkspaceAiCircuitPathHealth.IsReviewPathUsable(
                primaryCompletionOpen: true,
                fallbackGateRegistered: false,
                fallbackCompletionOpen: false,
                embeddingGateRegistered: true,
                embeddingOpen: false)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsReviewPathUsable_primary_open_with_closed_fallback_is_true()
    {
        WorkspaceAiCircuitPathHealth.IsReviewPathUsable(
                primaryCompletionOpen: true,
                fallbackGateRegistered: true,
                fallbackCompletionOpen: false,
                embeddingGateRegistered: true,
                embeddingOpen: false)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsReviewPathUsable_both_completion_gates_open_is_false()
    {
        WorkspaceAiCircuitPathHealth.IsReviewPathUsable(
                primaryCompletionOpen: true,
                fallbackGateRegistered: true,
                fallbackCompletionOpen: true,
                embeddingGateRegistered: true,
                embeddingOpen: false)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsReviewPathUsable_embedding_open_is_false()
    {
        WorkspaceAiCircuitPathHealth.IsReviewPathUsable(
                primaryCompletionOpen: false,
                fallbackGateRegistered: false,
                fallbackCompletionOpen: false,
                embeddingGateRegistered: true,
                embeddingOpen: true)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsReviewPathUsable_all_closed_is_true()
    {
        WorkspaceAiCircuitPathHealth.IsReviewPathUsable(
                primaryCompletionOpen: false,
                fallbackGateRegistered: true,
                fallbackCompletionOpen: false,
                embeddingGateRegistered: true,
                embeddingOpen: false)
            .Should()
            .BeTrue();
    }
}
