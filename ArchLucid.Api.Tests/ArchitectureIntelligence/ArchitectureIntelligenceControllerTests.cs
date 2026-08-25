using ArchLucid.Api.Controllers.ArchitectureIntelligence;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureIntelligenceControllerTests
{
    [Fact]
    public async Task PostRunAsync_null_body_returns_400()
    {
        ArchitectureIntelligenceController controller = CreateController();

        IActionResult action = await controller.PostRunAsync(request: null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.RequestBodyRequired);
    }

    [Fact]
    public async Task PostGoldenTestAsync_empty_source_texts_returns_400()
    {
        ArchitectureIntelligenceController controller = CreateController();

        IActionResult action = await controller.PostGoldenTestAsync(
            new ClosedLoopReasoningRequest { SourceTexts = [] },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PostRunAsync_sets_tenant_from_scope_and_returns_result()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ClosedLoopReasoningRequest? captured = null;

        Mock<IClosedLoopArchitectureReasoningOrchestrator> orchestrator = new();
        orchestrator
            .Setup(o => o.RunAsync(It.IsAny<ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ClosedLoopReasoningRequest, CancellationToken>((request, _) => captured = request)
            .ReturnsAsync(new ClosedLoopReasoningResult());

        ArchitectureIntelligenceController controller = CreateController(
            reasoningOrchestrator: orchestrator.Object,
            tenantId: tenantId);

        ClosedLoopReasoningRequest body = new()
        {
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.txt",
                    ContentType = "text/plain",
                    Content = "Three-tier web app with API gateway.",
                },
            ],
        };

        IActionResult action = await controller.PostRunAsync(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<ClosedLoopReasoningResult>();
        captured.Should().NotBeNull();
        captured!.TenantId.Should().Be(tenantId.ToString("D"));
    }

    [Fact]
    public async Task GetProductRunSourceContextAsync_returns_mapped_request()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IArchitectureIntelligenceProductRunSourceContextLoader> loader = new();
        loader
            .Setup(l => l.LoadAsync(runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureIntelligenceProductRunSourceContextLoadResult.Success(
                new ClosedLoopReasoningRequest
                {
                    TenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    RunId = runId.ToString("D"),
                    SourceTexts =
                    [
                        new ClosedLoopReasoningSourceText
                        {
                            FileName = "architecture-description.txt",
                            ContentType = "text/plain",
                            Content = "API without auth.",
                        },
                    ],
                }));

        ArchitectureIntelligenceController controller = CreateController(productRunSourceContextLoader: loader.Object);

        IActionResult action = await controller.GetProductRunSourceContextAsync(runId.ToString("D"), CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ClosedLoopReasoningRequest body = ok.Value.Should().BeOfType<ClosedLoopReasoningRequest>().Subject;
        body.RunId.Should().Be(runId.ToString("D"));
        body.SourceTexts.Should().ContainSingle(source => source.Content.Contains("API without auth"));
    }

    [Fact]
    public async Task GetProductRunSourceContextAsync_returns_404_when_run_missing()
    {
        Mock<IArchitectureIntelligenceProductRunSourceContextLoader> loader = new();
        loader
            .Setup(l => l.LoadAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureIntelligenceProductRunSourceContextLoadResult.NotFound("missing"));

        ArchitectureIntelligenceController controller = CreateController(productRunSourceContextLoader: loader.Object);

        IActionResult action = await controller.GetProductRunSourceContextAsync(
            Guid.NewGuid().ToString("D"),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static ArchitectureIntelligenceController CreateController(
        IClosedLoopArchitectureReasoningOrchestrator? reasoningOrchestrator = null,
        IGoldenArchitectureTestRunner? goldenArchitectureTestRunner = null,
        IArchitectureIntelligenceProductRunSourceContextLoader? productRunSourceContextLoader = null,
        Guid? tenantId = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId ?? Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000"),
        });

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new ArchitectureIntelligenceController(
            reasoningOrchestrator ?? Mock.Of<IClosedLoopArchitectureReasoningOrchestrator>(),
            goldenArchitectureTestRunner ?? Mock.Of<IGoldenArchitectureTestRunner>(),
            knowledgeModelAccess: null,
            productPublishService: Mock.Of<IArchitectureIntelligenceProductPublishService>(),
            productRunSourceContextLoader ?? Mock.Of<IArchitectureIntelligenceProductRunSourceContextLoader>(),
            scopeProvider.Object,
            auditService.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
