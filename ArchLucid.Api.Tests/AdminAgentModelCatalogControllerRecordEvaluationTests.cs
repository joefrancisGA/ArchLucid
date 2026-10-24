using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminAgentModelCatalogControllerRecordEvaluationTests
{
    [Fact]
    public async Task RecordEvaluation_returns_not_found_when_alias_id_unknown()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "missing-alias",
                "Primary",
                AgentModelEvaluationStateKind.Evaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Alias not found."));

        AdminAgentModelCatalogController controller = new(
            Mock.Of<IAgentModelCatalogRepository>(),
            recorder.Object,
            Mock.Of<IAgentModelCatalogFaithfulnessHarnessImporter>(),
            Mock.Of<IAgentModelCatalogCacheInvalidator>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IScopeContextProvider>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.RecordEvaluation(
            "missing-alias",
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest
            {
                EvaluationState = nameof(AgentModelEvaluationStateKind.Evaluated),
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RecordEvaluation_returns_not_found_when_task_type_route_segment_empty()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                string.Empty,
                AgentModelEvaluationStateKind.Evaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Task type not found."));

        AdminAgentModelCatalogController controller = new(
            Mock.Of<IAgentModelCatalogRepository>(),
            recorder.Object,
            Mock.Of<IAgentModelCatalogFaithfulnessHarnessImporter>(),
            Mock.Of<IAgentModelCatalogCacheInvalidator>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IScopeContextProvider>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.RecordEvaluation(
            "gpt-test",
            string.Empty,
            new RecordAgentModelCatalogEvaluationRequest
            {
                EvaluationState = nameof(AgentModelEvaluationStateKind.Evaluated),
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
