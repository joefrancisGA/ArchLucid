using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Intake;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WizardIntakeDraftsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static WizardIntakeDraftsController BuildSut(Mock<IWizardIntakeDraftService>? service = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ArchLucid.Core.Tenancy.ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Core.Tenancy.TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new ArchLucid.Core.Tenancy.TenantWorkspaceListItem
                {
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return new WizardIntakeDraftsController(
            scopeProvider.Object,
            tenants.Object,
            (service ?? new Mock<IWizardIntakeDraftService>()).Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    private static WizardIntakeDraftResponse Draft(string wizardId = "wizard-1") => new()
    {
        WizardId = wizardId,
        StepIndex = 2,
        StateJson = "{\"step\":2}",
        UpdatedUtc = new DateTime(2026, 8, 31, 12, 0, 0, DateTimeKind.Utc)
    };

    [Fact]
    public async Task GetDraft_returns_ok_with_draft_when_present()
    {
        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        service
            .Setup(s => s.GetAsync(Scope, "wizard-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Draft());
        WizardIntakeDraftsController sut = BuildSut(service);

        IActionResult action = await sut.GetDraft("wizard-1", CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Draft());
    }

    [Fact]
    public async Task GetDraft_returns_not_found_when_draft_missing()
    {
        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        service
            .Setup(s => s.GetAsync(Scope, "wizard-missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((WizardIntakeDraftResponse?)null);
        WizardIntakeDraftsController sut = BuildSut(service);

        IActionResult action = await sut.GetDraft("wizard-missing", CancellationToken.None);

        action.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetDraft_passes_current_scope_to_service_for_tenant_workspace_scoping()
    {
        ScopeContext? observed = null;
        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        service
            .Setup(s => s.GetAsync(It.IsAny<ScopeContext>(), "wizard-1", It.IsAny<CancellationToken>()))
            .Callback<ScopeContext, string, CancellationToken>((scope, _, _) => observed = scope)
            .ReturnsAsync(Draft());
        WizardIntakeDraftsController sut = BuildSut(service);

        IActionResult action = await sut.GetDraft("wizard-1", CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        observed.Should().BeSameAs(Scope);
    }

    [Fact]
    public async Task UpsertDraft_returns_bad_request_when_body_is_null()
    {
        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        WizardIntakeDraftsController sut = BuildSut(service);

        IActionResult action = await sut.UpsertDraft("wizard-1", body: null, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpsertDraft_returns_ok_and_passes_current_scope_to_service()
    {
        ScopeContext? observed = null;
        UpsertWizardIntakeDraftRequest body = new()
        {
            StepIndex = 3,
            StateJson = "{\"step\":3}",
            IdempotencyKey = "idem-1"
        };
        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        service
            .Setup(s => s.UpsertAsync(
                It.IsAny<ScopeContext>(),
                "wizard-1",
                body,
                It.IsAny<CancellationToken>()))
            .Callback<ScopeContext, string, UpsertWizardIntakeDraftRequest, CancellationToken>(
                (scope, _, _, _) => observed = scope)
            .ReturnsAsync(Draft());
        WizardIntakeDraftsController sut = BuildSut(service);

        IActionResult action = await sut.UpsertDraft("wizard-1", body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Draft());
        observed.Should().BeSameAs(Scope);
    }
}
