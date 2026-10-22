using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MeteringAdminControllerTests
{
    private static MeteringAdminController CreateSut(
        IUsageMeteringService metering,
        Guid tenantId)
    {
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId });

        return new MeteringAdminController(metering, scopeContextProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    [SkippableFact]
    public async Task GetSummaryAsync_returns_bad_request_when_period_end_not_after_start()
    {
        Mock<IUsageMeteringService> metering = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        MeteringAdminController sut = CreateSut(metering.Object, tenantId);
        DateTimeOffset start = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        DateTimeOffset end = start;

        IActionResult result = await sut.GetSummaryAsync(start, end, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        metering.Verify(
            m => m.GetSummaryAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task GetSummaryAsync_returns_rows_from_metering()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset periodStart = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        DateTimeOffset periodEnd = DateTimeOffset.Parse("2026-02-01T00:00:00Z");
        TenantUsageSummary row = new()
        {
            TenantId = tenantId,
            Kind = UsageMeterKind.ApiRequest,
            TotalQuantity = 42,
            PeriodStartUtc = periodStart,
            PeriodEndUtc = periodEnd
        };
        Mock<IUsageMeteringService> metering = new();
        metering
            .Setup(m => m.GetSummaryAsync(tenantId, periodStart, periodEnd, It.IsAny<CancellationToken>()))
            .ReturnsAsync([row]);
        MeteringAdminController sut = CreateSut(metering.Object, tenantId);

        IActionResult result =
            await sut.GetSummaryAsync(periodStart, periodEnd, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<TenantUsageSummary> body = ok.Value.Should().BeAssignableTo<IReadOnlyList<TenantUsageSummary>>()
            .Subject;
        body.Should().ContainSingle().Which.Should().BeSameAs(row);
    }
}
