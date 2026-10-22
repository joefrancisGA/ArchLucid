using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.CustomerSuccess;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminCustomerSuccessControllerTests
{
    [SkippableFact]
    public async Task GetTenantHealthAsync_returns_mapped_rows()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        DateTimeOffset lastActivity = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);

        Mock<IAdminTenantHealthReader> reader = new();
        reader
            .Setup(r => r.ListSummariesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AdminTenantHealthSummaryRow(
                    tenantId,
                    Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    42m,
                    70m,
                    3,
                    1,
                    5,
                    2,
                    0,
                    lastActivity)
            ]);

        AdminCustomerSuccessController sut = new(reader.Object);

        ActionResult<AdminTenantHealthListResponse> result =
            await sut.GetTenantHealthAsync(CancellationToken.None);

        OkObjectResult ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        AdminTenantHealthListResponse body = ok.Value.Should().BeOfType<AdminTenantHealthListResponse>().Subject;
        body.Items.Should().ContainSingle();
        body.Items[0].TenantId.Should().Be(tenantId);
        body.Items[0].PilotFunnelStage.Should().Be("Committed");
        body.Items[0].RunsLast7d.Should().Be(3);
        body.Items[0].LastActivityUtc.Should().Be(lastActivity);
    }
}
