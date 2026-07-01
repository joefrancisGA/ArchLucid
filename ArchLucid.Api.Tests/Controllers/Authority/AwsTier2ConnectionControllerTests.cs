using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Controllers.Authority;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AwsTier2ConnectionControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ConnectionId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task ConfigureAsync_returns_bad_request_when_body_is_null()
    {
        AwsTier2ConnectionController sut = CreateSut(Mock.Of<IAwsTier2ConnectionService>(), Mock.Of<IAuditService>());

        IActionResult result = await sut.ConfigureAsync(null!, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ConfigureAsync_returns_bad_request_when_service_validation_fails()
    {
        Mock<IAwsTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ConfigureAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<AwsTier2ConnectionConfigureRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("accountId is required"));

        AwsTier2ConnectionController sut = CreateSut(connectionService.Object, Mock.Of<IAuditService>());

        IActionResult result = await sut.ConfigureAsync(
            new AwsTier2ConnectionConfigureBody
            {
                AccountId = "",
                Region = "us-east-1",
                RoleArn = "arn:aws:iam::123456789012:role/ReadOnly",
            },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ConfigureAsync_returns_ok_and_audits_on_success()
    {
        AwsTier2ConnectionSummary summary = new()
        {
            ConnectionId = ConnectionId,
            AccountId = "123456789012",
            Region = "us-east-1",
            RoleArn = "arn:aws:iam::123456789012:role/ReadOnly",
            Status = AwsConnectionStatus.Connected,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IAwsTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ConfigureAsync(
                Scope.TenantId,
                "actor-id",
                It.IsAny<AwsTier2ConnectionConfigureRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IAuditService> auditService = new();

        AwsTier2ConnectionController sut = CreateSut(connectionService.Object, auditService.Object);

        IActionResult result = await sut.ConfigureAsync(
            new AwsTier2ConnectionConfigureBody
            {
                AccountId = summary.AccountId,
                Region = summary.Region,
                RoleArn = summary.RoleArn,
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        AwsTier2ConnectionResponse response = ok.Value.Should().BeOfType<AwsTier2ConnectionResponse>().Subject;
        response.ConnectionId.Should().Be(ConnectionId);
        response.AccountId.Should().Be(summary.AccountId);

        auditService.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListConnectionsAsync_returns_mapped_records()
    {
        AwsTier2ConnectionSummary summary = new()
        {
            ConnectionId = ConnectionId,
            AccountId = "123456789012",
            Region = "us-east-1",
            RoleArn = "arn:aws:iam::123456789012:role/ReadOnly",
            Status = AwsConnectionStatus.Connected,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IAwsTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.ListConnectionsAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { summary });

        AwsTier2ConnectionController sut = CreateSut(connectionService.Object, Mock.Of<IAuditService>());

        IActionResult result = await sut.ListConnectionsAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<AwsTier2ConnectionResponse> responses =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<AwsTier2ConnectionResponse>>().Subject;

        responses.Should().ContainSingle(r => r.ConnectionId == ConnectionId);
    }

    [Fact]
    public async Task DisconnectAsync_returns_no_content_and_audits()
    {
        Mock<IAwsTier2ConnectionService> connectionService = new();
        connectionService
            .Setup(s => s.DisconnectAsync(
                Scope.TenantId,
                ConnectionId,
                "actor-id",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        AwsTier2ConnectionController sut = CreateSut(connectionService.Object, auditService.Object);

        IActionResult result = await sut.DisconnectAsync(ConnectionId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        auditService.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static AwsTier2ConnectionController CreateSut(
        IAwsTier2ConnectionService connectionService,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-id");

        return new AwsTier2ConnectionController(
            connectionService,
            scopeProvider.Object,
            actorContext.Object,
            auditService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
