using System.Security.Claims;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernancePreCommitSimulationControllerAuditTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Simulate_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        const string actorKey = "jwt:tenant:operator-oid";
        List<AuditEvent> captured = [];

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        PreCommitGateResult gateResult = new()
        {
            Blocked = false,
            WarnOnly = false,
            Reason = "ok",
        };

        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(service => service.SimulateSyntheticFindingsAsync(
                runId.ToString("D"),
                FindingSeverity.Critical,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(gateResult);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured.Add(evt))
            .Returns(Task.CompletedTask);

        GovernancePreCommitSimulationController controller = new(
            gate.Object,
            Mock.Of<IPreFinalizeChecklistService>(),
            Mock.Of<IFinalizeReadinessService>(),
            actorContext.Object,
            auditService.Object,
            runs.Object,
            scopeProvider.Object,
            tenants.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity(
                            [new Claim(ClaimTypes.Name, "Operator Display")],
                            "test")),
                },
            },
        };

        IActionResult action = await controller.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = runId.ToString("D"),
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        AuditEvent simulationAudit = captured.Should().ContainSingle().Subject;
        simulationAudit.ExplicitActor.Should().BeTrue();
        simulationAudit.ActorUserId.Should().Be(actorKey);
        simulationAudit.ActorUserName.Should().Be("Operator Display");
        simulationAudit.EventType.Should().Be(AuditEventTypes.GovernancePreCommitSimulationEvaluated);
    }
}
