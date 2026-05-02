using ArchLucid.Api.Controllers.Advisory;
using ArchLucid.Api.Models.ProductLearning;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.ProductLearning;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductLearningSignalControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [SkippableFact]
    public async Task PostSignal_persists_scoped_signal_and_actor()
    {
        ProductLearningPilotSignalRecord? captured = null;
        Mock<IProductLearningPilotSignalRepository> repo = new();
        repo.Setup(r => r.InsertAsync(It.IsAny<ProductLearningPilotSignalRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ProductLearningPilotSignalRecord, CancellationToken>((s, _) => captured = s)
            .Returns(Task.CompletedTask);
        ProductLearningController sut = BuildController(repo.Object);

        ProductLearningSignalRequest request = new()
        {
            ArchitectureRunId = " run-1 ",
            SubjectType = " Finding ",
            Disposition = ProductLearningDispositionValues.NeedsFollowUp,
            PatternKey = " rule/security ",
            ArtifactHint = " finding:f-1 ",
            CommentShort = " Needs clearer evidence. "
        };

        IActionResult result = await sut.PostSignal(request, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        captured.Should().NotBeNull();
        captured!.TenantId.Should().Be(Scope.TenantId);
        captured.WorkspaceId.Should().Be(Scope.WorkspaceId);
        captured.ProjectId.Should().Be(Scope.ProjectId);
        captured.ArchitectureRunId.Should().Be("run-1");
        captured.SubjectType.Should().Be("Finding");
        captured.Disposition.Should().Be(ProductLearningDispositionValues.NeedsFollowUp);
        captured.ArtifactHint.Should().Be("finding:f-1");
        captured.CommentShort.Should().Be("Needs clearer evidence.");
        captured.RecordedByUserId.Should().Be("actor-key");
        captured.RecordedByDisplayName.Should().Be("Pilot User");
    }

    [SkippableFact]
    public async Task PostSignal_rejects_unknown_disposition()
    {
        Mock<IProductLearningPilotSignalRepository> repo = new();
        ProductLearningController sut = BuildController(repo.Object);

        ProductLearningSignalRequest request = new()
        {
            SubjectType = "Finding",
            Disposition = "Maybe"
        };

        IActionResult result = await sut.PostSignal(request, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.Verify(r => r.InsertAsync(It.IsAny<ProductLearningPilotSignalRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static ProductLearningController BuildController(IProductLearningPilotSignalRepository repo)
    {
        Mock<IProductLearningDashboardService> dashboard = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("actor-key");
        actor.Setup(a => a.GetActor()).Returns("Pilot User");
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new ProductLearningController(dashboard.Object, repo, actor.Object, scope.Object, audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
