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
