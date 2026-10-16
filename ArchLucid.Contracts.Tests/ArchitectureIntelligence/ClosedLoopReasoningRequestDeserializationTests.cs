using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopReasoningRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_source_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "sourceTexts": null,
              "declaredPriorities": null,
              "framingAnswers": null
            }
            """;

        ClosedLoopReasoningRequest? request =
            JsonSerializer.Deserialize<ClosedLoopReasoningRequest>(json, ContractJson.CamelCaseCompact);

        request.Should().NotBeNull();
        request!.SourceTexts.Should().NotBeNull().And.BeEmpty();
        request.DeclaredPriorities.Should().NotBeNull().And.BeEmpty();
        request.FramingAnswers.Should().NotBeNull().And.BeEmpty();
    }
}
