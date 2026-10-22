using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.ContextIngestion.Infrastructure.Canonical;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class CanonicalInfrastructureObjectMapperTests
{
    [Fact]
    public void BuildOccurrenceAwareStableIdentity_adds_occurrence_suffix_for_duplicates()
    {
        Dictionary<string, int> totals = new(StringComparer.OrdinalIgnoreCase)
        {
            ["deployment|default/api"] = 2,
        };
        Dictionary<string, int> seen = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

        string first = CanonicalInfrastructureObjectMapper.BuildOccurrenceAwareStableIdentity(
            "deployment|default/api",
            totals,
            seen,
            properties,
            "k8sOccurrence");

        string second = CanonicalInfrastructureObjectMapper.BuildOccurrenceAwareStableIdentity(
            "deployment|default/api",
            totals,
            seen,
            properties,
            "k8sOccurrence");

        first.Should().Be("deployment|default/api|occurrence:1");
        second.Should().Be("deployment|default/api|occurrence:2");
        properties["k8sOccurrence"].Should().Be("2");
    }

    [Fact]
    public void CanonicalObjectPropertyReader_trims_blank_values()
    {
        CanonicalObject canonicalObject = new()
        {
            ObjectType = "TopologyResource",
            Name = "api",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["region"] = "  ",
                ["tf.region"] = " westeurope ",
            },
        };

        CanonicalObjectPropertyReader.TryGetProperty(canonicalObject, "region").Should().BeNull();
        CanonicalObjectPropertyReader.TryGetProperty(canonicalObject, "tf.region").Should().Be("westeurope");
    }
}
