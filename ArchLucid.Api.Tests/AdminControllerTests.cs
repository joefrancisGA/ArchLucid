using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.FeatureManagement;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public void GetConfigLint_returns_snapshot_with_blocking_and_advisory_findings()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        AdminController controller = CreateController(configuration: configuration);

        ActionResult<AdminConfigLintResponse> action = controller.GetConfigLint(includeAdvisory: true);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        AdminConfigLintResponse body = ok.Value.Should().BeOfType<AdminConfigLintResponse>().Subject;

        body.HostingEnvironmentName.Should().NotBeNullOrWhiteSpace();
        body.BlockingFindings.Should().NotBeNull();
        body.AdvisoryFindings.Should().NotBeNull();
    }

    [Fact]
    public void GetConfigSummary_returns_catalog_keys()
    {
        AdminController controller = CreateController();

        ActionResult<AdminConfigSummaryResponse> action = controller.GetConfigSummary(includeEffectiveValues: false);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        AdminConfigSummaryResponse body = ok.Value.Should().BeOfType<AdminConfigSummaryResponse>().Subject;

        body.Keys.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetOutboxes_returns_diagnostics_snapshot()
    {
        AdminOutboxSnapshot snapshot = new(1, 2, 3, 4, 5);

        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.GetOutboxSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AdminController controller = CreateController(diagnostics: diagnostics.Object);

        IActionResult action = await controller.GetOutboxes(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(snapshot);
    }

    [Fact]
    public async Task GetAsyncAuthorityPipelineFeature_reflects_feature_manager()
    {
        Mock<IFeatureManager> features = new();
        features
            .Setup(f => f.IsEnabledAsync(AuthorityPipelineFeatureFlags.AsyncAuthorityPipeline, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        AdminController controller = CreateController(featureManager: features.Object);

        IActionResult action = await controller.GetAsyncAuthorityPipelineFeature(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        AsyncAuthorityPipelineFeatureState state =
            ok.Value.Should().BeOfType<AsyncAuthorityPipelineFeatureState>().Subject;

        state.Enabled.Should().BeTrue();
    }

    [Fact]
    public async Task UploadTenantCoverLogoAsync_returns_service_unavailable_when_store_not_configured()
    {
        AdminController controller = CreateController(tenantReviewBoardCoverLogoStore: null);

        IActionResult action = await controller.UploadTenantCoverLogoAsync(null, CancellationToken.None);

        ObjectResult unavailable = action.Should().BeOfType<ObjectResult>().Subject;
        unavailable.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task UploadTenantCoverLogoAsync_returns_bad_request_when_file_missing()
    {
        Mock<ITenantReviewBoardCoverLogoStore> store = new();

        AdminController controller = CreateController(tenantReviewBoardCoverLogoStore: store.Object);

        IActionResult action = await controller.UploadTenantCoverLogoAsync(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ListIntegrationOutboxDeadLetters_delegates_to_diagnostics()
    {
        List<IntegrationEventOutboxDeadLetterRow> rows =
        [
            new() { OutboxId = Guid.NewGuid(), EventType = "test.event" }
        ];

        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.ListIntegrationOutboxDeadLettersAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        AdminController controller = CreateController(diagnostics: diagnostics.Object);

        IActionResult action = await controller.ListIntegrationOutboxDeadLetters(maxRows: 25, cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(rows);
    }

    private static AdminController CreateController(
        IConfiguration? configuration = null,
        IAdminDiagnosticsService? diagnostics = null,
        IFeatureManager? featureManager = null,
        ITenantReviewBoardCoverLogoStore? tenantReviewBoardCoverLogoStore = null)
    {
        Mock<IHostEnvironment> hostEnvironment = new();
        hostEnvironment.Setup(h => h.EnvironmentName).Returns(Environments.Development);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new AdminController(
            configuration ?? new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build(),
            hostEnvironment.Object,
            diagnostics ?? Mock.Of<IAdminDiagnosticsService>(),
            featureManager ?? Mock.Of<IFeatureManager>(),
            scopeProvider.Object,
            Mock.Of<IAuditService>(),
            tenantReviewBoardCoverLogoStore)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
