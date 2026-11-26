using System.Security.Claims;

using ArchLucid.Api.Controllers.Findings;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInsightSignalShareAccessTests
{
    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task Skips_evidence_and_signal_storage_when_run_cannot_be_read(bool post, bool scopedRunFound)
    {
        const string actorId = "fixture-operator";
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
        };
        Guid runId = Guid.NewGuid();
        Guid architectureId = Guid.NewGuid();
        CancellationToken ct = CancellationToken.None;
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IActorContext> actor = new(MockBehavior.Strict);
        actor.Setup(a => a.GetActorId()).Returns(actorId);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdAsync(scope, runId, ct)).ReturnsAsync(scopedRunFound ? new RunRecord
        {
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ScopeProjectId = scope.ProjectId,
            RunId = runId, ArchitectureId = architectureId,
        } : null);
        Mock<IArchitectureShareAccessService> shares = new(MockBehavior.Strict);
        shares.Setup(s => s.EvaluateAsync(scope, architectureId, actorId, true, false, false, ct))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation { ArchitectureFound = true, RestrictToShares = true });
        Mock<IAuthorityQueryService> evidence = new(MockBehavior.Strict);
        Mock<IFindingInsightSignalRepository> signals = new(MockBehavior.Strict);
        Mock<IManifestHashService> hash = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        FindingInsightSignalController controller = new(evidence.Object, signals.Object, scopes.Object, hash.Object,
            audit.Object, new ArchitectureShareAccessGate(shares.Object, actor.Object, runs.Object),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<FindingInsightSignalController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.Name, actorId), new Claim(ClaimTypes.Role, ArchLucidRoles.Reader)], "Test")),
                },
            },
        };

        IActionResult result = post
            ? await controller.PostInsightSignalAsync(runId, "fixture-finding",
                new RecordFindingInsightSignalRequest { Kind = FindingInsightSignalKind.DidNotThinkOfThat }, ct)
            : await controller.GetInsightSignalStatusAsync(runId, "fixture-finding", ct);

        result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        runs.Verify(r => r.GetByIdAsync(scope, runId, ct), Times.Once);
        shares.Verify(s => s.EvaluateAsync(scope, architectureId, actorId, true, false, false, ct),
            scopedRunFound ? Times.Once() : Times.Never());
        evidence.VerifyNoOtherCalls();
        signals.VerifyNoOtherCalls();
        hash.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }
}
