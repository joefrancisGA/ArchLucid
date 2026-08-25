using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class KnowledgeModelClarificationAnswerApplicatorTests
{
  private static readonly ScopeContext TestScope = new()
  {
    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
  };

  [Fact]
  public void IsFindingClarificationQuestionId_accepts_16_hex_chars()
  {
    string questionId = ReviewClarificationQuestionIdBuilder.Build(
        FindingTypes.TopologyCoverageFinding,
        "Compute");

    KnowledgeModelClarificationAnswerApplicator.IsFindingClarificationQuestionId(questionId).Should().BeTrue();
  }

  [Fact]
  public async Task ApplyAnswersAsync_projects_finding_clarification_onto_framing_and_assumption()
  {
    Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    string questionId = ReviewClarificationQuestionIdBuilder.Build(
        FindingTypes.TopologyCoverageFinding,
        "Compute");
    string answer = "The API tier runs on Azure App Service.";
    string modelId = "model-initial";

    ArchitectureKnowledgeModel model = new()
    {
      ModelId = modelId,
      TenantId = TestScope.TenantId.ToString("D"),
      RunId = runId.ToString("D"),
      CreatedUtc = DateTime.UtcNow,
      UpdatedUtc = DateTime.UtcNow,
    };

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    persistence
      .Setup(p => p.GetModelAsync(TestScope.TenantId.ToString("D"), modelId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(model);
    persistence
      .Setup(p => p.SaveModelAsync(It.IsAny<ArchitectureKnowledgeModel>(), It.IsAny<CancellationToken>()))
      .Returns(Task.CompletedTask);

    Mock<IRunRepository> runs = new();
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new RunRecord { RunId = runId, KnowledgeModelId = modelId });
    runs
      .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
      .Returns(Task.CompletedTask);

    ArchitectureKnowledgeModelAccess access = new(persistence.Object, runs.Object);
    KnowledgeModelClarificationAnswerApplicator sut = new(access);

    int applied = await sut.ApplyAnswersAsync(
        TestScope,
        runId,
        new Dictionary<string, string> { [questionId] = answer },
        CancellationToken.None);

    applied.Should().Be(1);

    model.FramingAnswers[$"{KnowledgeModelClarificationAnswerApplicator.FindingClarificationFramingKeyPrefix}{questionId}"]
        .Should().Be(answer);

    string formatted = OperatorAssertedClarificationAnswerFormatter.Format(questionId, answer);
    model.Elements.Should().ContainSingle(element =>
        element.Kind == ArchitectureElementKind.Assumption
        && element.Description == formatted);
  }
}
