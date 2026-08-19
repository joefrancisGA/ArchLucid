using System.Reflection;
using System.Text.Json;

using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Explanation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredExplanationLlmPromptSchemaTests
{
    [Fact]
    public void BuildRunExplanationJsonResponseInstructions_includes_all_structured_explanation_properties()
    {
        string instructions =
            StructuredExplanationLlmPromptSchema.BuildRunExplanationJsonResponseInstructions("hint");

        foreach (PropertyInfo property in typeof(StructuredExplanation).GetProperties())
        {
            string jsonName = JsonNamingPolicy.CamelCase.ConvertName(property.Name);
            instructions.Should().Contain(jsonName + ":");
        }
    }

    [Fact]
    public void BuildRunExplanationJsonResponseInstructions_includes_example_and_prose_fallback()
    {
        string instructions =
            StructuredExplanationLlmPromptSchema.BuildRunExplanationJsonResponseInstructions("hint");

        instructions.Should().Contain("Example:");
        instructions.Should().Contain("plain prose only");
        instructions.Should().Contain("hint");
    }

    [Fact]
    public void BuildRunExplanationJsonResponseInstructions_mandates_alternatives_considered()
    {
        string instructions =
            StructuredExplanationLlmPromptSchema.BuildRunExplanationJsonResponseInstructions("hint");

        instructions.Should().Contain("alternativesConsidered:");
        instructions.Should().Contain("(required)");
        instructions.Should().Contain("rejected architectural alternative");
        instructions.Should().Contain("not an empty array");
    }

    [Fact]
    public void BuildExampleJson_deserializes_to_structured_explanation()
    {
        string json = StructuredExplanationLlmPromptSchema.BuildExampleJson();

        StructuredExplanation? parsed = JsonSerializer.Deserialize<StructuredExplanation>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        parsed.Should().NotBeNull();
        parsed!.SchemaVersion.Should().Be(1);
        parsed.Reasoning.Should().Be("...");
        parsed.EvidenceRefs.Should().Equal("dec-1");
        parsed.Confidence.Should().Be(0.72m);
        parsed.AlternativesConsidered.Should()
            .ContainSingle()
            .Which.Should()
            .Contain("monolith");
    }

    [Fact]
    public void FormatPropertyLine_marks_reasoning_required()
    {
        PropertyInfo reasoning = typeof(StructuredExplanation).GetProperty(nameof(StructuredExplanation.Reasoning))!;

        string line = StructuredExplanationLlmPromptSchema.FormatPropertyLine(reasoning, "extra");

        line.Should().Contain("reasoning: string (required)");
        line.Should().Contain("extra");
    }
}
