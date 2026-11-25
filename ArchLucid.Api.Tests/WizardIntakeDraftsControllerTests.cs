using System.Security.Claims;

using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.Support;
using ArchLucid.Application.Intake;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
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
public sealed class WizardIntakeDraftsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static WizardIntakeDraftsController BuildSut(
        Mock<IWizardIntakeDraftService>? service = null,
        IArchitectureShareAccessGate? shareGate = null,
        IRunDetailQueryService? runDetails = null,
        IAuthorityQueryService? authorityQuery = null)
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
            (service ?? new Mock<IWizardIntakeDraftService>()).Object,
            authorityQuery ?? SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            runDetails ?? SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            shareGate ?? Mock.Of<IArchitectureShareAccessGate>())
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

    [Theory]
    [InlineData(false, null)]
    [InlineData(true, null)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    [InlineData(false, false)]
    [InlineData(true, false)]
    public async Task Wizard_actions_read_only_an_authorized_committed_manifest(
        bool saveDraft,
        bool? readableSealValid)
    {
        const string wizardId = "wizard-1";
        Guid deniedRun = Guid.NewGuid();
        Guid missingRun = Guid.NewGuid();
        Guid readableRun = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        List<RunSummary> candidates = [Committed(deniedRun), Committed(missingRun)];
        if (readableSealValid is not null)
            candidates.Add(Committed(readableRun));

        Mock<IRunDetailQueryService> runDetails = new(MockBehavior.Strict);
        runDetails.Setup(query => query.ListRunSummariesKeysetAsync(null, 50, ct))
            .ReturnsAsync(((IReadOnlyList<RunSummary>)candidates, false, (string?)null));

        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> shares = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        WizardIntakeDraftsController sut = BuildSut(service, shares.Object, runDetails.Object, authority.Object);
        ClaimsPrincipal principal = new(new ClaimsIdentity("test"));
        sut.HttpContext.User = principal;
        MockSequence sequence = new();
        shares.InSequence(sequence).Setup(gate => gate.EvaluateRunReadAsync(principal, Scope, deniedRun, ct))
            .ReturnsAsync((true, false));
        shares.InSequence(sequence).Setup(gate => gate.EvaluateRunReadAsync(principal, Scope, missingRun, ct))
            .ReturnsAsync((false, false));

        if (readableSealValid is bool valid)
        {
            shares.InSequence(sequence).Setup(gate => gate.EvaluateRunReadAsync(principal, Scope, readableRun, ct))
                .ReturnsAsync((true, true));
            authority.InSequence(sequence).Setup(query => query.GetRunDetailForManifestCompareAsync(
                    It.Is<ScopeContext>(scope => scope.TenantId == Scope.TenantId &&
                        scope.WorkspaceId == Scope.WorkspaceId && scope.ProjectId == Scope.ProjectId),
                    readableRun, ct))
                .ReturnsAsync(new RunDetailDto
                {
                    Run = new RunRecord { RunId = readableRun, GoldenManifestId = manifestId },
                    GoldenManifest = new ManifestDocument
                    {
                        RunId = readableRun,
                        ManifestId = manifestId,
                        ManifestHash = valid ? SealedManifestHashTestSupport.DefaultHash : "invalid",
                    },
                });
        }

        UpsertWizardIntakeDraftRequest body = new()
        {
            StepIndex = 3,
            StateJson = "{}",
            IdempotencyKey = "idem-1",
        };
        if (readableSealValid is not false)
        {
            if (saveDraft)
                service.InSequence(sequence).Setup(s => s.UpsertAsync(Scope, wizardId, body, ct)).ReturnsAsync(Draft());
            else
                service.InSequence(sequence).Setup(s => s.GetAsync(Scope, wizardId, ct)).ReturnsAsync(Draft());
        }

        IActionResult action = saveDraft
            ? await sut.UpsertDraft(wizardId, body, ct)
            : await sut.GetDraft(wizardId, ct);

        if (readableSealValid is false)
        {
            action.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
            service.VerifyNoOtherCalls();
        }
        else
        {
            action.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeEquivalentTo(Draft());
        }

        shares.Invocations.Should().HaveCount(candidates.Count);
        authority.Invocations.Should().HaveCount(readableSealValid is null ? 0 : 1);
    }

    private static RunSummary Committed(Guid runId) => new()
    {
        RunId = runId.ToString("N"),
        Status = nameof(ArchitectureRunStatus.Committed),
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

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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
