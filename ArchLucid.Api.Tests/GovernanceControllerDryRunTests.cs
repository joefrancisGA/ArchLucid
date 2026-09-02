using System.Security.Claims;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP surface for governance <c>?dryRun=true</c> (response headers and controller wiring).
/// </summary>
[Trait("Category", "Unit")]
public sealed class GovernanceControllerDryRunTests
{
    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    };

    [SkippableFact]
    public async Task SubmitApprovalRequest_WhenDryRun_SetsDryRunResponseHeader()
    {
        string runId = RunId.ToString("D");

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.SubmitApprovalRequestAsync(
                runId,
                "v1",
                "dev",
                "test",
                "actor-1",
                "actor-1",
                null,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new GovernanceApprovalRequest
                {
                    RunId = runId,
                    ManifestVersion = "v1",
                    SourceEnvironment = "dev",
                    TargetEnvironment = "test",
                    Status = GovernanceApprovalStatus.Submitted
                });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("actor-1");
        actor.Setup(a => a.GetActorId()).Returns("actor-1");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(t => t.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "tester")]))
        };

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            workflowFacade: workflow.Object,
            actorContext: actor.Object,
            scopeContextProvider: scope.Object,
            runRepository: runs.Object,
            tenantRepository: tenants.Object,
            httpContext: http);

        IActionResult actionResult = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = runId,
                ManifestVersion = "v1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test"
            },
            true,
            CancellationToken.None);

        actionResult.Should().BeOfType<OkObjectResult>();
        http.Response.Headers[ArchLucidHttpHeaders.DryRun].ToString().Should().Be("true");
    }

    [SkippableFact]
    public async Task Promote_WhenDryRun_SetsDryRunResponseHeader()
    {
        string runId = RunId.ToString("D");

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.PromoteAsync(
                runId,
                "v1",
                "test",
                GovernanceEnvironment.Prod,
                "promoter",
                "apr-1",
                null,
                true,
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new GovernancePromotionRecord
                {
                    RunId = runId,
                    ManifestVersion = "v1",
                    SourceEnvironment = "test",
                    TargetEnvironment = GovernanceEnvironment.Prod,
                    PromotedBy = "promoter",
                    ApprovalRequestId = "apr-1"
                });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("promoter");
        actor.Setup(a => a.GetActorId()).Returns("promoter");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(t => t.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "promoter")]))
        };

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(a => a.GetByIdAsync("apr-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new GovernanceApprovalRequest
                {
                    ApprovalRequestId = "apr-1",
                    RunId = runId,
                });

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            workflowFacade: workflow.Object,
            approvalRepository: approvals.Object,
            actorContext: actor.Object,
            scopeContextProvider: scope.Object,
            runRepository: runs.Object,
            tenantRepository: tenants.Object,
            httpContext: http);

        IActionResult actionResult = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId,
                ManifestVersion = "v1",
                SourceEnvironment = "test",
                TargetEnvironment = GovernanceEnvironment.Prod,
                PromotedBy = "promoter",
                ApprovalRequestId = "apr-1"
            },
            true,
            CancellationToken.None);

        actionResult.Should().BeOfType<OkObjectResult>();
        http.Response.Headers[ArchLucidHttpHeaders.DryRun].ToString().Should().Be("true");
    }
}
