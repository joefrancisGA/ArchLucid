using ArchLucid.Provenance;

using FluentAssertions;

namespace ArchLucid.Provenance.Tests;

[Trait("Category", "Unit")]
public sealed class ProvenanceNodeCoalesceTests
{
    [Fact]
    public void ApplyMergedFields_normalizes_reference_id_when_incoming_value_has_surrounding_whitespace()
    {
        ProvenanceNode existing = new()
        {
            Type = ProvenanceNodeType.Decision,
            ReferenceId = "dec-1",
            Name = "Enable WAF",
        };
        ProvenanceNode incoming = new()
        {
            Type = ProvenanceNodeType.Decision,
            ReferenceId = "  dec-1  ",
            Name = "dec-1",
        };

        ProvenanceNodeCoalesce.ApplyMergedFields(existing, incoming);

        existing.ReferenceId.Should().Be("dec-1");
        existing.Name.Should().Be("Enable WAF");
    }

    [Fact]
    public void ApplyMergedFields_trims_metadata_values_when_incoming_has_surrounding_whitespace()
    {
        ProvenanceNode existing = new()
        {
            Type = ProvenanceNodeType.Finding,
            ReferenceId = "finding-1",
            Name = "Open port",
            Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["findingType"] = "Compliance",
            },
        };
        ProvenanceNode incoming = new()
        {
            Type = ProvenanceNodeType.Finding,
            ReferenceId = "finding-1",
            Name = "finding-1",
            Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["findingType"] = "  Compliance  ",
                ["category"] = "  security  ",
            },
        };

        ProvenanceNodeCoalesce.ApplyMergedFields(existing, incoming);

        existing.Metadata["findingType"].Should().Be("Compliance");
        existing.Metadata["category"].Should().Be("security");
        existing.Name.Should().Be("Open port");
    }

    [Fact]
    public void ShouldSkipGraphNodeNameDowngrade_returns_true_when_incoming_name_has_surrounding_whitespace_matching_reference_id()
    {
        ProvenanceNode existing = new()
        {
            Type = ProvenanceNodeType.Decision,
            ReferenceId = "dec-1",
            Name = "Enable WAF",
        };
        ProvenanceNode incoming = new()
        {
            Type = ProvenanceNodeType.Decision,
            ReferenceId = "dec-1",
            Name = "  dec-1  ",
        };

        ProvenanceNodeCoalesce.ShouldSkipGraphNodeNameDowngrade(existing, incoming)
            .Should()
            .BeTrue();
    }
}
