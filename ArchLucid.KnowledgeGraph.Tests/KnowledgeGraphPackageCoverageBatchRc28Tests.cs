using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Inference;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     RC28 package-coverage batch: projection-cache invalidation wire format, options validation, no-op cache
///     backends, and full inference-source reasoning summaries.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class KnowledgeGraphPackageCoverageBatchRc28Tests
{
    [Fact]
    public void GraphProjectionCacheInvalidationMessageSerializer_round_trips()
    {
        GraphProjectionCacheInvalidationMessage message = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            RunId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            GraphSnapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        };

        byte[] bytes = GraphProjectionCacheInvalidationMessageSerializer.Serialize(message);
        GraphProjectionCacheInvalidationMessage? roundTripped =
            GraphProjectionCacheInvalidationMessageSerializer.Deserialize(bytes);

        roundTripped.Should().NotBeNull();
        roundTripped!.TenantId.Should().Be(message.TenantId);
        roundTripped.WorkspaceId.Should().Be(message.WorkspaceId);
        roundTripped.ProjectId.Should().Be(message.ProjectId);
        roundTripped.RunId.Should().Be(message.RunId);
        roundTripped.GraphSnapshotId.Should().Be(message.GraphSnapshotId);
    }

    [Fact]
    public void GraphProjectionCacheInvalidationMessageSerializer_Serialize_null_throws()
    {
        FluentActions
            .Invoking(() => GraphProjectionCacheInvalidationMessageSerializer.Serialize(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void GraphProjectionCacheInvalidationMessageSerializer_Deserialize_empty_or_bad_json_returns_null()
    {
        GraphProjectionCacheInvalidationMessageSerializer.Deserialize(ReadOnlySpan<byte>.Empty).Should().BeNull();
        GraphProjectionCacheInvalidationMessageSerializer.Deserialize("{not-json"u8).Should().BeNull();
    }

    [Fact]
    public void KnowledgeGraphProjectionCacheOptionsValidator_accepts_defaults()
    {
        KnowledgeGraphProjectionCacheOptionsValidator validator = new();
        KnowledgeGraphProjectionCacheOptions options = new();

        ValidateOptionsResult result = validator.Validate(null, options);

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void KnowledgeGraphProjectionCacheOptionsValidator_rejects_expiration_below_one()
    {
        KnowledgeGraphProjectionCacheOptionsValidator validator = new();
        KnowledgeGraphProjectionCacheOptions options = new() { AbsoluteExpirationSeconds = 0 };

        ValidateOptionsResult result = validator.Validate(null, options);

        result.Failed.Should().BeTrue();
        result.FailureMessage.Should().Contain(nameof(KnowledgeGraphProjectionCacheOptions.AbsoluteExpirationSeconds));
    }

    [Fact]
    public void KnowledgeGraphProjectionCacheOptionsValidator_rejects_expiration_above_max()
    {
        KnowledgeGraphProjectionCacheOptionsValidator validator = new();
        KnowledgeGraphProjectionCacheOptions options = new()
        {
            AbsoluteExpirationSeconds = 100,
            MaxAbsoluteExpirationSeconds = 50,
        };

        ValidateOptionsResult result = validator.Validate(null, options);

        result.Failed.Should().BeTrue();
        result.FailureMessage.Should().Contain(nameof(KnowledgeGraphProjectionCacheOptions.MaxAbsoluteExpirationSeconds));
    }

    [Fact]
    public void KnowledgeGraphProjectionCacheOptionsValidator_null_options_throws()
    {
        KnowledgeGraphProjectionCacheOptionsValidator validator = new();

        FluentActions
            .Invoking(() => validator.Validate(null, null!))
            .Should()
            .Throw<ArgumentNullException>()
            .WithParameterName("options");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void GraphEdgeInferenceReasoningSummaries_ForRule_blank_returns_empty(string? source)
    {
        GraphEdgeInferenceReasoningSummaries.ForRule(source!).Should().BeEmpty();
    }

    [Theory]
    [InlineData(GraphEdgeInferenceSources.ContextMembership, "context")]
    [InlineData(GraphEdgeInferenceSources.ExplicitParentChild, "parentNodeId")]
    [InlineData(GraphEdgeInferenceSources.HeuristicNetworkSubnet, "subnet")]
    [InlineData(GraphEdgeInferenceSources.PolicyTargeted, "applicableTopologyNodeIds")]
    [InlineData(GraphEdgeInferenceSources.PolicySingleTopologyFallback, "lone resource")]
    [InlineData(GraphEdgeInferenceSources.RequirementTargeted, "relatedTopologyNodeIds")]
    [InlineData(GraphEdgeInferenceSources.RequirementTextHeuristic, "hypothesis")]
    [InlineData(GraphEdgeInferenceSources.SecurityTargeted, "protectedTopologyNodeIds")]
    [InlineData(GraphEdgeInferenceSources.SecuritySingleTopologyFallback, "exactly one topology")]
    public void GraphEdgeInferenceReasoningSummaries_ForRule_covers_known_sources(string source, string expectedFragment)
    {
        string summary = GraphEdgeInferenceReasoningSummaries.ForRule("  " + source + "  ");

        summary.Should().ContainEquivalentOf(expectedFragment);
    }

    [Fact]
    public void NullGraphProjectionCacheInvalidationBroadcaster_PublishInvalidation_is_noop()
    {
        ScopeContext scope = CreateScope();

        FluentActions
            .Invoking(() => NullGraphProjectionCacheInvalidationBroadcaster.Instance.PublishInvalidation(
                scope,
                Guid.NewGuid(),
                Guid.NewGuid()))
            .Should()
            .NotThrow();
    }

    [Fact]
    public async Task NonCachingGraphSnapshotProjectionCache_GetOrLoadAsync_invokes_loader()
    {
        ScopeContext scope = CreateScope();
        GraphSnapshot expected = new() { GraphSnapshotId = Guid.NewGuid() };
        bool loaded = false;

        GraphSnapshot? actual = await NonCachingGraphSnapshotProjectionCache.Instance.GetOrLoadAsync(
            scope,
            Guid.NewGuid(),
            expected.GraphSnapshotId,
            _ =>
            {
                loaded = true;

                return Task.FromResult<GraphSnapshot?>(expected);
            },
            CancellationToken.None);

        loaded.Should().BeTrue();
        actual.Should().BeSameAs(expected);

        FluentActions
            .Invoking(() => NonCachingGraphSnapshotProjectionCache.Instance.Invalidate(
                scope,
                Guid.NewGuid(),
                Guid.NewGuid()))
            .Should()
            .NotThrow();
    }

    [Fact]
    public async Task NonCachingGraphSnapshotProjectionCache_GetOrLoadAsync_rejects_null_args()
    {
        Func<CancellationToken, Task<GraphSnapshot?>> loader = _ => Task.FromResult<GraphSnapshot?>(null);

        await FluentActions
            .Invoking(() => NonCachingGraphSnapshotProjectionCache.Instance.GetOrLoadAsync(
                null!,
                Guid.NewGuid(),
                Guid.NewGuid(),
                loader,
                CancellationToken.None))
            .Should()
            .ThrowAsync<ArgumentNullException>();

        await FluentActions
            .Invoking(() => NonCachingGraphSnapshotProjectionCache.Instance.GetOrLoadAsync(
                CreateScope(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                null!,
                CancellationToken.None))
            .Should()
            .ThrowAsync<ArgumentNullException>();
    }

    private static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
    }
}
