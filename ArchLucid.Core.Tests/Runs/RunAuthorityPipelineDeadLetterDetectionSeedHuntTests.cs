using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Runs;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunAuthorityPipelineDeadLetterDetectionSeedHuntTests
{
    [Fact]
    public void IsDeadLettered_returns_true_for_string_encoded_schema_version()
    {
        const string json = """
            {"schemaVersion":"1","failureClass":"pipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_true_for_whole_number_double_schema_version()
    {
        const string json = """
            {"schemaVersion":1.0,"failureClass":"pipelineDeadLetter"}
            """;

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }
}
