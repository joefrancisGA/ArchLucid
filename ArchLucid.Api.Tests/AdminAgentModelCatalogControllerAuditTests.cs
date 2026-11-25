using System.Security.Claims;

using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdminAgentModelCatalogControllerAuditTests
{
    [Fact]
    public async Task Upsert_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        AuditEvent? captured = null;

        AgentModelCatalogRow row = new()
        {
            AliasId = "gpt-test",
            ProviderConnectionKind = "azure-openai",
            CapabilityTags = ["structured-output"],
            ApprovedTaskTypes = ["Primary"],
            DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
            LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
        };

        Mock<IAgentModelCatalogRepository> catalogRepository = new();
        catalogRepository
            .Setup(r => r.TryGetAsync(row.AliasId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentModelCatalogRow?)null);
        catalogRepository
            .Setup(r => r.UpsertAsync(row, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        AdminAgentModelCatalogController controller = new(
            catalogRepository.Object,
            Mock.Of<IAgentModelCatalogEvaluationRecorder>(),
            Mock.Of<IAgentModelCatalogFaithfulnessHarnessImporter>(),
            Mock.Of<IAgentModelCatalogCacheInvalidator>(),
            actorContext.Object,
            auditService.Object,
            scopeProvider.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        [new Claim(ClaimTypes.Name, "Operator Display")],
                        "test")),
            },
        };

        await controller.Upsert(row.AliasId, row, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be("Operator Display");
    }

    [Fact]
    public async Task Provider_override_denies_tenant_admin_before_any_audit_or_state_access()
    {
        AdminAgentModelCatalogController controller = CreateOverrideController(ArchLucidRoles.Admin);
        Mock<IProviderQualityStateStore> store = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        DurableProviderQualityMonitor monitor = new(Options.Create(new ProviderQualityOptions()), store.Object);

        IActionResult result = await controller.PutProviderQualityOverrideAsync(
            OverrideRequest(), monitor, audit.Object, CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
        audit.VerifyNoOtherCalls();
        store.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Provider_override_does_not_change_state_when_audit_append_fails()
    {
        AdminAgentModelCatalogController controller = CreateOverrideController(ArchLucidRoles.PlatformOperator);
        Mock<IProviderQualityStateStore> store = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit.Setup(x => x.AppendAsync(
                It.Is<PlatformAuditEvent>(row => row.ActorUserId == "operator-id" && row.SubjectTenantId == Guid.Empty),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit unavailable"));
        DurableProviderQualityMonitor monitor = new(Options.Create(new ProviderQualityOptions()), store.Object);

        Func<Task> act = () => controller.PutProviderQualityOverrideAsync(
            OverrideRequest(), monitor, audit.Object, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("audit unavailable");
        store.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Provider_override_records_platform_intent_before_attempting_state_change()
    {
        AdminAgentModelCatalogController controller = CreateOverrideController(ArchLucidRoles.PlatformOperator);
        Mock<IProviderQualityStateStore> store = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        MockSequence sequence = new();
        audit.InSequence(sequence).Setup(x => x.AppendAsync(
                It.Is<PlatformAuditEvent>(row => row.ActorUserId == "operator-id"
                    && row.EventType == "AiProviderQualityOverrideRequested"
                    && row.DataJson.Contains("Incident 123", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        store.InSequence(sequence).Setup(x => x.UpdateAsync<bool>(
                It.IsAny<string>(),
                It.IsAny<Func<string?, (string? Replacement, bool Result)>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        IActionResult result = await controller.PutProviderQualityOverrideAsync(
            OverrideRequest(), new DurableProviderQualityMonitor(Options.Create(new ProviderQualityOptions()), store.Object),
            audit.Object, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    private static AdminAgentModelCatalogController.ProviderQualityOverrideRequest OverrideRequest() =>
        new("azure-openai", "primary", "v1", true, 10, "Incident 123");

    private static AdminAgentModelCatalogController CreateOverrideController(string role)
    {
        AdminAgentModelCatalogController controller = new(
            Mock.Of<IAgentModelCatalogRepository>(),
            Mock.Of<IAgentModelCatalogEvaluationRecorder>(),
            Mock.Of<IAgentModelCatalogFaithfulnessHarnessImporter>(),
            Mock.Of<IAgentModelCatalogCacheInvalidator>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IScopeContextProvider>());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, "operator-id"), new Claim(ClaimTypes.Role, role)], "test")),
            },
        };
        return controller;
    }
}
