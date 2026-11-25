using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Ensures operator/UI-facing artifact ordering stays deterministic (name, then id).
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArtifactDescriptorMapperTests
{
    private static SynthesizedArtifact Artifact(Guid id, string name)
    {
        return new SynthesizedArtifact
        {
            ArtifactId = id,
            RunId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            ManifestId = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = "Test",
            Name = name,
            Format = "json",
            Content = "{}",
            ContentHash = "abc"
        };
    }

    [SkippableFact]
    public void OrderSynthesizedArtifacts_SortsByNameCaseInsensitiveThenArtifactId()
    {
        Guid idA = Guid.Parse("00000000-0000-0000-0000-000000000002");
        Guid idB = Guid.Parse("00000000-0000-0000-0000-000000000001");
        SynthesizedArtifact[] input =
        [
            Artifact(idA, "SAME"),
            Artifact(idB, "same"),
            Artifact(Guid.Parse("00000000-0000-0000-0000-000000000003"), "Alpha")
        ];

        IReadOnlyList<SynthesizedArtifact> ordered = ArtifactDescriptorMapper.OrderSynthesizedArtifacts(input);

        ordered[0].Name.Should().Be("Alpha");
        ordered[1].Name.Should().Be("same");
        ordered[2].Name.Should().Be("SAME");
        ordered[1].ArtifactId.Should().Be(idB);
        ordered[2].ArtifactId.Should().Be(idA);
    }

    [SkippableFact]
    public void ToDescriptorList_PreservesSameOrderAsOrderSynthesizedArtifacts()
    {
        Guid id1 = Guid.Parse("00000000-0000-0000-0000-000000000001");
        Guid id2 = Guid.Parse("00000000-0000-0000-0000-000000000002");
        SynthesizedArtifact[] input = [Artifact(id2, "z"), Artifact(id1, "a")];

        IReadOnlyList<ArtifactDescriptor> descriptors = ArtifactDescriptorMapper.ToDescriptorList(input);

        descriptors.Should().HaveCount(2);
        descriptors[0].Name.Should().Be("a");
        descriptors[1].Name.Should().Be("z");
        descriptors[0].ArtifactId.Should().Be(id1);
        descriptors[1].ArtifactId.Should().Be(id2);
        for (int i = 0; i < descriptors.Count; i++)
        {
            SynthesizedArtifact source = input.Single(artifact => artifact.ArtifactId == descriptors[i].ArtifactId);
            descriptors[i].ArtifactType.Should().Be(source.ArtifactType);
            descriptors[i].Format.Should().Be(source.Format);
            descriptors[i].CreatedUtc.Should().Be(source.CreatedUtc);
            descriptors[i].ContentHash.Should().Be(source.ContentHash);
        }
    }
}
