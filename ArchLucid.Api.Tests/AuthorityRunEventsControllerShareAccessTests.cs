using System.Security.Claims;
using System.Text;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityRunEventsControllerShareAccessTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ArchitectureId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private const string ActorId = "event-stream-reader";

    private readonly Mock<IRunRepository> _runs = new(MockBehavior.Strict);
    private readonly Mock<IArchitectureShareAccessService> _shares = new(MockBehavior.Strict);
    private readonly Mock<IAuthorityQueryService> _query = new(MockBehavior.Strict);
    private readonly Mock<IManifestHashService> _hash = new(MockBehavior.Strict);

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Missing_scoped_or_restricted_run_never_reaches_evidence_or_starts_stream(bool scopedRunFound)
    {
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        await using ServiceProvider services = new ServiceCollection().AddLogging().AddControllers()
            .Services.BuildServiceProvider();
        using MemoryStream body = new();
        AuthorityRunEventsController controller = BuildController(services, body);
        _runs.Setup(r => r.GetByIdAsync(Scope, RunId, ct)).ReturnsAsync(scopedRunFound ? RunInScope() : null);
        if (scopedRunFound)
        {
            _shares.Setup(s => s.EvaluateAsync(Scope, ArchitectureId, ActorId, true, false, false, ct))
                .ReturnsAsync(new ArchitectureShareAccessEvaluation { ArchitectureFound = true, RestrictToShares = true });
        }

        await controller.GetRunEvents(RunId, ct);

        controller.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        controller.Response.ContentType.Should().StartWith("application/problem+json");
        Encoding.UTF8.GetString(body.ToArray()).Should().NotContain("event: ");
        _query.VerifyNoOtherCalls();
        _hash.VerifyNoOtherCalls();
        _runs.Verify(r => r.GetByIdAsync(Scope, RunId, ct), Times.Once);
        _shares.Verify(s => s.EvaluateAsync(Scope, ArchitectureId, ActorId, true, false, false, ct),
            scopedRunFound ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task Allowed_run_checks_scope_and_share_before_detail_and_preserves_status_and_completion_events()
    {
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        using MemoryStream body = new();
        AuthorityRunEventsController controller = BuildController(null, body);
        RunRecord run = RunInScope();
        MockSequence sequence = new();
        _runs.InSequence(sequence).Setup(r => r.GetByIdAsync(Scope, RunId, ct)).ReturnsAsync(run);
        _shares.InSequence(sequence)
            .Setup(s => s.EvaluateAsync(Scope, ArchitectureId, ActorId, true, false, false, ct))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true, RestrictToShares = true, CanRead = true,
            });
        _query.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, RunId, ct))
            .ReturnsAsync(new RunDetailDto { Run = run });
        _query.InSequence(sequence).Setup(q => q.GetRunSummaryAsync(Scope, RunId, ct))
            .ReturnsAsync(new RunSummaryDto { RunId = RunId, ProjectId = "stream-test", GoldenManifestId = Guid.NewGuid() });

        await controller.GetRunEvents(RunId, ct);

        controller.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        controller.Response.ContentType.Should().Be("text/event-stream");
        Encoding.UTF8.GetString(body.ToArray()).Should().Contain("event: status")
            .And.Contain("event: complete").And.Contain("golden-manifest-ready");
    }

    private AuthorityRunEventsController BuildController(IServiceProvider? services, Stream body)
    {
        Mock<IScopeContextProvider> scope = new(MockBehavior.Strict);
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new(MockBehavior.Strict);
        actor.Setup(a => a.GetActorId()).Returns(ActorId);
        ClaimsPrincipal principal = new(new ClaimsIdentity([new Claim(ClaimTypes.Role, ArchLucidRoles.Reader)], "Test"));
        DefaultHttpContext context = new() { User = principal };
        if (services is not null)
            context.RequestServices = services;

        context.Request.Headers.Accept = "text/event-stream";
        context.Response.Body = body;

        return new(_query.Object, scope.Object, _hash.Object,
            new ArchitectureShareAccessGate(_shares.Object, actor.Object, _runs.Object))
        {
            ControllerContext = new ControllerContext { HttpContext = context },
        };
    }

    private static RunRecord RunInScope() => new()
    {
        TenantId = Scope.TenantId,
        WorkspaceId = Scope.WorkspaceId,
        ScopeProjectId = Scope.ProjectId,
        RunId = RunId,
        ArchitectureId = ArchitectureId,
        GraphSnapshotId = Guid.NewGuid(),
    };
}
