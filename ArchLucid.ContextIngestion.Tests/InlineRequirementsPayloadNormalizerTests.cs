using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class InlineRequirementsPayloadNormalizerTests
{
    [Fact]
    public async Task NormalizeAsync_LongRequirementsWithSharedNamePrefix_UseDistinctNames()
    {
        string sharedPrefix = new('a', 80);
        string first = sharedPrefix + "suffix-one";
        string second = sharedPrefix + "suffix-two";

        InlineRequirementsPayloadNormalizer sut = new();

        NormalizedContextBatch batch = await sut.NormalizeAsync(
            new InlineRequirementsPayload { InlineRequirements = [first, second] },
            CancellationToken.None);

        batch.CanonicalObjects.Should().HaveCount(2);
        batch.CanonicalObjects.Select(static o => o.Name).Distinct(StringComparer.Ordinal).Should().HaveCount(2);
        batch.CanonicalObjects.Should().OnlyContain(o => o.Name.StartsWith(sharedPrefix, StringComparison.Ordinal));
        batch.CanonicalObjects.Should().OnlyContain(o => o.Name.Contains('#', StringComparison.Ordinal));
    }
}
