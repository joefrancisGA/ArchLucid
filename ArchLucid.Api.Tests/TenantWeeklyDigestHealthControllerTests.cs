using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWeeklyDigestHealthControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetAsync_maps_reader_snapshot_to_response()
    {
        WeeklyDigestHealthSnapshot snapshot = new()
        {
            EnabledAdvisoryScheduleCount = 2,
            DigestSubscriptionCount = 5,
            EnabledDigestSubscriptionCount = 3,
            ExecutiveEmailDigestIsConfigured = true,
            ExecutiveEmailDigestEnabled = true,
            ExecutiveDigestRecipientCount = 4,
            SetupGaps = ["missing-slack-webhook"]
        };

        Mock<IWeeklyDigestHealthReader> reader = new();
        reader
            .Setup(r => r.GetSnapshotAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantWeeklyDigestHealthController controller = new(scopeProvider.Object, reader.Object);

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        WeeklyDigestHealthResponse body = ok.Value.Should().BeOfType<WeeklyDigestHealthResponse>().Subject;

        body.EnabledAdvisoryScheduleCount.Should().Be(2);
        body.ExecutiveDigestRecipientCount.Should().Be(4);
        body.SetupGaps.Should().ContainSingle("missing-slack-webhook");
    }
}
