using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Controllers.Authority;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class Tier2ConnectionControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    };

    private static readonly Guid ConnectionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task ConfigureAsync_returns_bad_request_when_body_is_null()
    {
        Tier2ConnectionController sut = CreateSut(Mock.Of<ITier2ConnectionService>(), Mock.Of<IAuditService>());

        IActionResult result = await sut.ConfigureAsync(null!, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ConfigureAsync_returns_bad_request_when_service_validation_fails()
    {
        Mock<ITier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ConfigureAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Tier2ConnectionConfigureRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("tenantId is required"));

        Tier2ConnectionController sut = CreateSut(connectionService.Object, Mock.Of<IAuditService>());

        IActionResult result = await sut.ConfigureAsync(
            new Tier2ConnectionConfigureBody
            {
                TenantId = "",
                ClientId = "11111111-2222-3333-4444-555555555555",
                SubscriptionIds = "sub-1",
            },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ConfigureAsync_returns_ok_and_audits_on_success()
    {
        Tier2ConnectionSummary summary = new()
        {
            ConnectionId = ConnectionId,
            TenantIdAzure = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            ClientId = "11111111-2222-3333-4444-555555555555",
            SubscriptionIds = "sub-integration-test",
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ConfigureAsync(
                Scope.TenantId,
                "actor-id",
                It.IsAny<Tier2ConnectionConfigureRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IAuditService> auditService = new();
        Tier2ConnectionController sut = CreateSut(connectionService.Object, auditService.Object);

        IActionResult result = await sut.ConfigureAsync(
            new Tier2ConnectionConfigureBody
            {
                TenantId = summary.TenantIdAzure,
                ClientId = summary.ClientId,
                SubscriptionIds = summary.SubscriptionIds,
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        Tier2ConnectionResponse response = ok.Value.Should().BeOfType<Tier2ConnectionResponse>().Subject;
        response.ConnectionId.Should().Be(ConnectionId);
        response.TenantId.Should().Be(summary.TenantIdAzure);

        auditService.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListConnectionsAsync_returns_mapped_records()
    {
        Tier2ConnectionSummary summary = new()
        {
            ConnectionId = ConnectionId,
            TenantIdAzure = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            ClientId = "11111111-2222-3333-4444-555555555555",
            SubscriptionIds = "sub-integration-test",
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ListConnectionsAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { summary });

        Tier2ConnectionController sut = CreateSut(connectionService.Object, Mock.Of<IAuditService>());

        IActionResult result = await sut.ListConnectionsAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<Tier2ConnectionResponse> responses =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<Tier2ConnectionResponse>>().Subject;

        responses.Should().ContainSingle(r => r.ConnectionId == ConnectionId);
    }

    private static Tier2ConnectionController CreateSut(
        ITier2ConnectionService connectionService,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-id");

        return new Tier2ConnectionController(
            connectionService,
            scopeProvider.Object,
            actorContext.Object,
            auditService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
