using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Runs;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunAuthorityPipelineDeadLetterDetectionTests
{
    [Fact]
    public void IsDeadLettered_returns_true_for_pipeline_dead_letter_failure_class()
    {
        AgentExecutionFailureSummary summary = new()
        {
            FailureClass = AgentExecutionFailureClasses.PipelineDeadLetter,
        };

        string json = $$"""
            {"schemaVersion":1,"failureClass":"{{AgentExecutionFailureClasses.PipelineDeadLetter}}"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_true_for_PascalCase_pipeline_dead_letter_failure_class_value()
    {
        const string json = """
            {"schemaVersion":1,"failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_other_failure_classes()
    {
        const string json = """
            {"schemaVersion":1,"failureClass":"timeout"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeFalse();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_null_or_non_json()
    {
        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered((string?)null).Should().BeFalse();
        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered("plain text").Should().BeFalse();
    }

    [Fact]
    public void IsDeadLettered_returns_true_for_string_encoded_schema_version()
    {
        const string json = """
            {"schemaVersion":"1","failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_true_for_whole_number_double_schema_version()
    {
        const string json = """
            {"schemaVersion":1.0,"failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_true_when_schema_version_property_is_omitted()
    {
        const string json = """
            {"failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_true_when_schema_version_property_is_null()
    {
        const string json = """
            {"schemaVersion":null,"failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_boolean_true_schema_version()
    {
        const string json = """
            {"schemaVersion":true,"failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeFalse();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_string_on_schema_version_synonym()
    {
        const string json = """
            {"schemaVersion":"on","failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeFalse();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_string_encoded_boolean_true_schema_version()
    {
        const string json = """
            {"schemaVersion":"true","failureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeFalse();
    }

    [Fact]
    public void IsDeadLettered_returns_true_for_PascalCase_failure_class_property_name()
    {
        const string json = """
            {"schemaVersion":1,"FailureClass":"PipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }
}
