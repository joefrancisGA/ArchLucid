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

    [Fact]
    public async Task RecordEvaluation_returns_bad_request_when_request_body_is_null()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();

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
            "Primary",
            null,
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<AgentModelEvaluationStateKind>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordEvaluation_returns_bad_request_when_evaluation_state_is_null()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();

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

        RecordAgentModelCatalogEvaluationRequest request = new() { EvaluationState = null! };

        IActionResult result = await controller.RecordEvaluation(
            "gpt-test",
            "Primary",
            request,
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<AgentModelEvaluationStateKind>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordEvaluation_returns_bad_request_when_evaluation_state_empty_string()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest { EvaluationState = string.Empty },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<AgentModelEvaluationStateKind>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordEvaluation_accepts_evaluation_state_not_evaluated_string()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.NotEvaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentModelCatalogRow
            {
                AliasId = "gpt-test",
                ProviderConnectionKind = "azure-openai",
                CapabilityTags = ["structured-output"],
                ApprovedTaskTypes = ["Primary"],
            });

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest
            {
                EvaluationState = nameof(AgentModelEvaluationStateKind.NotEvaluated),
            },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.NotEvaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordEvaluation_accepts_evaluation_state_failed_with_wrong_casing()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Failed,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentModelCatalogRow
            {
                AliasId = "gpt-test",
                ProviderConnectionKind = "azure-openai",
                CapabilityTags = ["structured-output"],
                ApprovedTaskTypes = ["Primary"],
            });

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest { EvaluationState = "failed" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Failed,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordEvaluation_accepts_evaluation_state_numeric_two_as_failed()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Failed,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentModelCatalogRow
            {
                AliasId = "gpt-test",
                ProviderConnectionKind = "azure-openai",
                CapabilityTags = ["structured-output"],
                ApprovedTaskTypes = ["Primary"],
            });

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest { EvaluationState = "2" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Failed,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordEvaluation_accepts_evaluation_state_numeric_one_as_evaluated()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Evaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentModelCatalogRow
            {
                AliasId = "gpt-test",
                ProviderConnectionKind = "azure-openai",
                CapabilityTags = ["structured-output"],
                ApprovedTaskTypes = ["Primary"],
            });

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest { EvaluationState = "1" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Evaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordEvaluation_accepts_evaluation_state_numeric_zero_as_not_evaluated()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.NotEvaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentModelCatalogRow
            {
                AliasId = "gpt-test",
                ProviderConnectionKind = "azure-openai",
                CapabilityTags = ["structured-output"],
                ApprovedTaskTypes = ["Primary"],
            });

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest { EvaluationState = "0" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.NotEvaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordEvaluation_accepts_evaluation_state_with_surrounding_whitespace_on_evaluated()
    {
        Mock<IAgentModelCatalogEvaluationRecorder> recorder = new();
        recorder
            .Setup(r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Evaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentModelCatalogRow
            {
                AliasId = "gpt-test",
                ProviderConnectionKind = "azure-openai",
                CapabilityTags = ["structured-output"],
                ApprovedTaskTypes = ["Primary"],
            });

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
            "Primary",
            new RecordAgentModelCatalogEvaluationRequest { EvaluationState = " Evaluated " },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        recorder.Verify(
            static r => r.RecordTaskEvaluationAsync(
                "gpt-test",
                "Primary",
                AgentModelEvaluationStateKind.Evaluated,
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
