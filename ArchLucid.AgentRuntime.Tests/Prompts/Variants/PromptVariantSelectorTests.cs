using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Core.Persistence.Ports;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Prompts.Variants;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PromptVariantSelectorTests
{
    [Fact]
    public async Task TrySelectAsync_same_inputs_returns_same_variant()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Mock<IPromptVariantRegistry> registry = CreateRegistry(
            new PromptVariantRecord
            {
                PromptTemplateName = "critic-system",
                VariantKey = "baseline",
                WeightBps = 6000,
                PromptBody = null
            },
            new PromptVariantRecord
            {
                PromptTemplateName = "critic-system",
                VariantKey = "experiment-a",
                WeightBps = 4000,
                PromptBody = "experiment body"
            });

        PromptVariantSelector sut = new(registry.Object);

        PromptVariantSelection? first = await sut.TrySelectAsync("critic-system", tenantId, runId, "built-in", CancellationToken.None);
        PromptVariantSelection? second = await sut.TrySelectAsync("critic-system", tenantId, runId, "built-in", CancellationToken.None);

        first.Should().NotBeNull();
        second.Should().NotBeNull();
        first!.VariantKey.Should().Be(second!.VariantKey);
    }

    [Fact]
    public async Task TrySelectAsync_respects_weight_boundaries()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Mock<IPromptVariantRegistry> registry = CreateRegistry(
            new PromptVariantRecord
            {
                PromptTemplateName = "topology-system",
                VariantKey = "a",
                WeightBps = 3000,
                PromptBody = "A"
            },
            new PromptVariantRecord
            {
                PromptTemplateName = "topology-system",
                VariantKey = "b",
                WeightBps = 7000,
                PromptBody = "B"
            });

        PromptVariantSelector sut = new(registry.Object);
        Dictionary<string, int> counts = new(StringComparer.Ordinal);

        for (int i = 0; i < 200; i++)
        {
            Guid run = Guid.Parse($"cccccccc-cccc-cccc-cccc-{i:x12}");
            PromptVariantSelection? selection =
                await sut.TrySelectAsync("topology-system", tenantId, run, "built-in", CancellationToken.None);

            selection.Should().NotBeNull();
            counts[selection!.VariantKey] = counts.GetValueOrDefault(selection.VariantKey) + 1;
        }

        counts.Should().ContainKey("a");
        counts.Should().ContainKey("b");
        counts["a"].Should().BeGreaterThan(20);
        counts["b"].Should().BeGreaterThan(50);
    }

    [Fact]
    public async Task TrySelectAsync_uses_builtin_text_when_prompt_body_empty()
    {
        Mock<IPromptVariantRegistry> registry = CreateRegistry(
            new PromptVariantRecord
            {
                PromptTemplateName = "compliance-system",
                VariantKey = "baseline",
                WeightBps = 10000,
                PromptBody = null
            });

        PromptVariantSelector sut = new(registry.Object);

        PromptVariantSelection? selection = await sut.TrySelectAsync(
            "compliance-system",
            Guid.NewGuid(),
            Guid.NewGuid(),
            "built-in-text",
            CancellationToken.None);

        selection.Should().NotBeNull();
        selection!.PromptBody.Should().Be("built-in-text");
    }

    [Fact]
    public void ComputeBucket_is_deterministic()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        int a = PromptVariantBucketHasher.ComputeBucket(tenantId, runId, "critic-system");
        int b = PromptVariantBucketHasher.ComputeBucket(tenantId, runId, "critic-system");

        a.Should().Be(b);
        a.Should().BeInRange(0, 9999);
    }

    private static Mock<IPromptVariantRegistry> CreateRegistry(params PromptVariantRecord[] variants)
    {
        Mock<IPromptVariantRegistry> registry = new();
        registry
            .Setup(r => r.GetActiveVariantsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string name, CancellationToken _) =>
                variants.Where(v => v.PromptTemplateName == name).ToList());

        return registry;
    }
}
