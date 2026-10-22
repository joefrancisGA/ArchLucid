using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ProgressiveInterviewStateDeserializationTests
{
    [Fact]
    public void Deserialize_null_question_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "modelId": "model-1",
              "framingQuestions": null,
              "evidenceDrivenQuestions": null
            }
            """;

        ProgressiveInterviewState? state =
            JsonSerializer.Deserialize<ProgressiveInterviewState>(json, ContractJson.CamelCaseCompact);

        state.Should().NotBeNull();
        state!.FramingQuestions.Should().NotBeNull().And.BeEmpty();
        state.EvidenceDrivenQuestions.Should().NotBeNull().And.BeEmpty();
    }
}
