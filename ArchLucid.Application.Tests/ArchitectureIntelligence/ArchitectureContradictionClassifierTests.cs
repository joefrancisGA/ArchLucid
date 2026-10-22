using ArchLucid.Application.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureContradictionClassifierTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Classify_names_diagram_vs_prose_contradiction()
    {
        (string name, string notes) = ArchitectureContradictionClassifier.Classify(
            "The diagram contradicts the prose about database replication.");

        name.Should().Be("Diagram vs prose contradiction");
        notes.Should().Contain("diagram-vs-prose");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Classify_names_policy_vs_component_contradiction()
    {
        (string name, string notes) = ArchitectureContradictionClassifier.Classify(
            "The policy contradicts the component inventory.");

        name.Should().Be("Policy vs component contradiction");
        notes.Should().Contain("policy-vs-component");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Classify_names_generic_contradiction()
    {
        (string name, string notes) = ArchitectureContradictionClassifier.Classify(
            "These two artifacts contradict each other.");

        name.Should().Be("Contradiction");
        notes.Should().Contain("generic");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Classify_throws_when_source_text_is_null()
    {
        Action act = () => ArchitectureContradictionClassifier.Classify(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("sourceText");
    }
}
