using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Controllers.Authority;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GcpTier2ConnectionControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    };

    private static readonly Guid ConnectionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task ConfigureAsync_returns_bad_request_when_body_is_null()
    {
        GcpTier2ConnectionController sut = CreateSut(Mock.Of<IGcpTier2ConnectionService>(), Mock.Of<IAuditService>());

        IActionResult result = await sut.ConfigureAsync(null!, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ConfigureAsync_returns_bad_request_when_service_validation_fails()
    {
        Mock<IGcpTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ConfigureAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<GcpTier2ConnectionConfigureRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("projectId is required"));

        GcpTier2ConnectionController sut = CreateSut(connectionService.Object, Mock.Of<IAuditService>());

        IActionResult result = await sut.ConfigureAsync(
            new GcpTier2ConnectionConfigureBody
            {
                ProjectId = "",
                WorkloadIdentityPoolProvider =
                    "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
                ServiceAccountEmail = "svc@test.iam.gserviceaccount.com",
            },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ConfigureAsync_returns_ok_and_audits_on_success()
    {
        GcpTier2ConnectionSummary summary = new()
        {
            ConnectionId = ConnectionId,
            ProjectId = "my-gcp-project",
            WorkloadIdentityPoolProvider =
                "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
            ServiceAccountEmail = "svc@test.iam.gserviceaccount.com",
            Status = GcpConnectionStatus.Connected,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IGcpTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ConfigureAsync(
                Scope.TenantId,
                "actor-id",
                It.IsAny<GcpTier2ConnectionConfigureRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IAuditService> auditService = new();
        GcpTier2ConnectionController sut = CreateSut(connectionService.Object, auditService.Object);

        IActionResult result = await sut.ConfigureAsync(
            new GcpTier2ConnectionConfigureBody
            {
                ProjectId = summary.ProjectId,
                WorkloadIdentityPoolProvider = summary.WorkloadIdentityPoolProvider,
                ServiceAccountEmail = summary.ServiceAccountEmail,
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        GcpTier2ConnectionResponse response = ok.Value.Should().BeOfType<GcpTier2ConnectionResponse>().Subject;
        response.ConnectionId.Should().Be(ConnectionId);

        auditService.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListConnectionsAsync_returns_mapped_records()
    {
        GcpTier2ConnectionSummary summary = new()
        {
            ConnectionId = ConnectionId,
            ProjectId = "my-gcp-project",
            WorkloadIdentityPoolProvider =
                "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
            ServiceAccountEmail = "svc@test.iam.gserviceaccount.com",
            Status = GcpConnectionStatus.Connected,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IGcpTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ListConnectionsAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { summary });

        GcpTier2ConnectionController sut = CreateSut(connectionService.Object, Mock.Of<IAuditService>());

        IActionResult result = await sut.ListConnectionsAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<GcpTier2ConnectionResponse> responses =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<GcpTier2ConnectionResponse>>().Subject;

        responses.Should().ContainSingle(r => r.ConnectionId == ConnectionId);
    }

    [Fact]
    public async Task DisconnectAsync_returns_no_content_and_audits()
    {
        Mock<IGcpTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.DisconnectAsync(
                Scope.TenantId,
                ConnectionId,
                "actor-id",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        GcpTier2ConnectionController sut = CreateSut(connectionService.Object, auditService.Object);

        IActionResult result = await sut.DisconnectAsync(ConnectionId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        auditService.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static GcpTier2ConnectionController CreateSut(
        IGcpTier2ConnectionService connectionService,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-id");

        return new GcpTier2ConnectionController(
            connectionService,
            scopeProvider.Object,
            actorContext.Object,
            auditService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
