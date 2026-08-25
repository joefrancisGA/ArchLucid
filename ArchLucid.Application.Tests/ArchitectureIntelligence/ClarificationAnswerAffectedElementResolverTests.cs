using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClarificationAnswerAffectedElementResolverTests
{
  [Fact]
  public void Resolve_maps_km_and_finding_clarification_question_ids()
  {
    string findingQuestionId = ReviewClarificationQuestionIdBuilder.Build(
        FindingTypes.TopologyCoverageFinding,
        "Compute");

    List<string> ids = ClarificationAnswerAffectedElementResolver.Resolve(new Dictionary<string, string>
    {
      ["km-element-1"] = "Answer one.",
      [findingQuestionId] = "Answer two.",
    });

    ids.Should().Contain("element-1");
    ids.Should().Contain($"fc-{findingQuestionId}");
  }
}
