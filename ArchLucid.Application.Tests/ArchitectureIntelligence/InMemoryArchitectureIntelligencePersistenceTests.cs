using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureIntelligencePersistenceTests
{
    [Fact]
    public async Task SaveSource_and_GetSource_round_trip_content_and_hash()
    {
        InMemoryArchitectureIntelligencePersistence persistence = new();
        ImmutableSourceArtifact artifact = new()
        {
            ArtifactId = "artifact-1",
            TenantId = "tenant-1",
            ContentType = "text/plain",
            FileName = "source.txt",
            OwnershipClass = ArtifactOwnershipClass.Managed,
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            Version = "1",
        };

        byte[] content = "public api without auth"u8.ToArray();
        await persistence.SaveSourceAsync(artifact, content);

        (ImmutableSourceArtifact Artifact, byte[] Content)? stored =
            await persistence.GetSourceByArtifactIdAsync("artifact-1");

        stored.Should().NotBeNull();
        stored!.Value.Content.Should().Equal(content);
        stored.Value.Artifact.ContentSha256.Should().NotBeNullOrWhiteSpace();
        stored.Value.Artifact.TenantId.Should().Be("tenant-1");
    }

    [Fact]
    public async Task SaveModel_and_GetModel_round_trip_elements()
    {
        InMemoryArchitectureIntelligencePersistence persistence = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "element-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                },
            ],
            DeclaredPriorities = ["Security"],
            FramingAnswers = new Dictionary<string, string> { ["goal"] = "stability" },
        };

        await persistence.SaveModelAsync(model);

        ArchitectureKnowledgeModel? stored = await persistence.GetModelAsync("tenant-1", "model-1");

        stored.Should().NotBeNull();
        stored!.Elements.Should().ContainSingle();
        stored.DeclaredPriorities.Should().Contain("Security");
        stored.FramingAnswers["goal"].Should().Be("stability");
    }

    [Fact]
    public async Task SaveModel_round_trips_IsProvisionalSynthesis()
    {
        InMemoryArchitectureIntelligencePersistence persistence = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-provisional",
            TenantId = "tenant-1",
            IsProvisionalSynthesis = true,
        };

        await persistence.SaveModelAsync(model);

        ArchitectureKnowledgeModel? stored = await persistence.GetModelAsync("tenant-1", "model-provisional");

        stored.Should().NotBeNull();
        stored!.IsProvisionalSynthesis.Should().BeTrue();
    }
}
