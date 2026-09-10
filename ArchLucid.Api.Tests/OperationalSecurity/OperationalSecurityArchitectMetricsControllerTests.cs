using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.OperationalSecurity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationalSecurityArchitectMetricsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetOutcomeMetrics_returns_not_found_when_service_returns_null()
    {
        Guid fromSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid toSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<ISecureNowArchitectMetricsQueryService> metricsQueryService = new();
        metricsQueryService
            .Setup(service => service.TryGetOutcomeMetricsAsync(
                Scope,
                fromSnapshotId,
                toSnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((SecureNowArchitectOutcomeMetricsResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        OperationalSecurityArchitectMetricsController controller = new(
            metricsQueryService.Object,
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.GetOutcomeMetrics(
            fromSnapshotId,
            toSnapshotId,
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetOutcomeMetrics_returns_ok_when_service_returns_metrics()
    {
        Guid fromSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid toSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        SecureNowArchitectOutcomeMetricsResponse response = new()
        {
            FromSnapshotId = fromSnapshotId,
            ToSnapshotId = toSnapshotId,
            RuleVersion = SecureNowArchitectMetricsConstants.RuleVersion,
            CriticalOrHighConfidencePathsRemoved = 2,
            SupportingOperationalMetrics = new SecureNowArchitectSupportingOperationalMetricsResponse
            {
                OpenFindings = 5,
            },
        };

        Mock<ISecureNowArchitectMetricsQueryService> metricsQueryService = new();
        metricsQueryService
            .Setup(service => service.TryGetOutcomeMetricsAsync(
                Scope,
                fromSnapshotId,
                toSnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        OperationalSecurityArchitectMetricsController controller = new(
            metricsQueryService.Object,
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.GetOutcomeMetrics(
            fromSnapshotId,
            toSnapshotId,
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<SecureNowArchitectOutcomeMetricsResponse>()
            .Which.CriticalOrHighConfidencePathsRemoved.Should().Be(2);
    }
}
