using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

public sealed class ComplianceDriftTrendServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [SkippableFact]
    public async Task GetTrendAsync_EmptyRange_ProducesZeroBuckets()
    {
        Mock<IPolicyPackChangeLogRepository> repo = new();
        DateTime from = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = from.AddDays(1);
        repo.Setup(r => r.GetByTenantInRangeAsync(TenantId, from, to, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ComplianceDriftTrendService sut = new(repo.Object);

        IReadOnlyList<ComplianceDriftTrendPoint> points = await sut.GetTrendAsync(
            TenantId,
            from,
            to,
            TimeSpan.FromHours(6),
            CancellationToken.None);

        points.Should().HaveCount(4);
        points.Should().OnlyContain(p => p.ChangeCount == 0 && p.ChangesByType.Count == 0);
    }

    [SkippableFact]
    public async Task GetTrendAsync_GroupsByChangeType()
    {
        Mock<IPolicyPackChangeLogRepository> repo = new();
        DateTime from = new(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = from.AddHours(12);
        Guid pack = Guid.Parse("11111111-2222-3333-4444-555555555555");

        PolicyPackChangeLogEntry e1 = new()
        {
            PolicyPackId = pack,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChangeType = "Created",
            ChangedBy = "u1",
            ChangedUtc = from.AddHours(1),
        };

        PolicyPackChangeLogEntry e2 = new()
        {
            PolicyPackId = pack,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChangeType = "Created",
            ChangedBy = "u2",
            ChangedUtc = from.AddHours(2),
        };

        PolicyPackChangeLogEntry e3 = new()
        {
            PolicyPackId = pack,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChangeType = "Assigned",
            ChangedBy = "u3",
            ChangedUtc = from.AddHours(7),
        };

        repo.Setup(r => r.GetByTenantInRangeAsync(TenantId, from, to, It.IsAny<CancellationToken>()))
            .ReturnsAsync([e1, e2, e3]);

        ComplianceDriftTrendService sut = new(repo.Object);

        IReadOnlyList<ComplianceDriftTrendPoint> points = await sut.GetTrendAsync(
            TenantId,
            from,
            to,
            TimeSpan.FromHours(6),
            CancellationToken.None);

        points.Should().HaveCount(2);
        points[0].ChangeCount.Should().Be(2);
        points[0].ChangesByType["Created"].Should().Be(2);
        points[1].ChangeCount.Should().Be(1);
        points[1].ChangesByType["Assigned"].Should().Be(1);
    }

    [SkippableFact]
    public async Task GetTrendAsync_InvalidTenant_Throws()
    {
        ComplianceDriftTrendService sut = new(Mock.Of<IPolicyPackChangeLogRepository>());
        DateTime from = new(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);

        Func<Task> act = () => sut.GetTrendAsync(
            Guid.Empty,
            from,
            from.AddDays(1),
            TimeSpan.FromDays(1),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithParameterName("tenantId");
    }
}
