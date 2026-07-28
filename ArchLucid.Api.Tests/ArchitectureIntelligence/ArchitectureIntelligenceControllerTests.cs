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

    private static ArchitectureIntelligenceController CreateController(
        IClosedLoopArchitectureReasoningOrchestrator? reasoningOrchestrator = null,
        IGoldenArchitectureTestRunner? goldenArchitectureTestRunner = null,
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
            scopeProvider.Object,
            auditService.Object);
    }
}
