using ArchLucid.Persistence.Orchestration;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityPipelineWorkRepositoryCoreTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 1)]
    [InlineData(100, 100)]
    [InlineData(500, 100)]
    public void ClampDequeueBatch_clamps_to_repository_bounds(int input, int expected) =>
        AuthorityPipelineWorkRepositoryCore.ClampDequeueBatch(input).Should().Be(expected);

    [Theory]
    [InlineData(30, 60)]
    [InlineData(60, 60)]
    [InlineData(7200, 7200)]
    [InlineData(9000, 7200)]
    public void ClampLeaseDurationSeconds_clamps_to_repository_bounds(int input, int expected) =>
        AuthorityPipelineWorkRepositoryCore.ClampLeaseDurationSeconds(input).Should().Be(expected);

    [Fact]
    public void TenantRoundRobinEligibleBatch_interleaves_tenants_by_fifo_rank()
    {
        Guid tenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        List<TestRow> rows =
        [
            new(tenantA, new DateTime(2026, 1, 1, 0, 0, 1, DateTimeKind.Utc), Guid.Parse("11111111-1111-1111-1111-111111111111")),
            new(tenantB, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), Guid.Parse("22222222-2222-2222-2222-222222222222")),
            new(tenantA, new DateTime(2026, 1, 1, 0, 0, 2, DateTimeKind.Utc), Guid.Parse("33333333-3333-3333-3333-333333333333")),
        ];

        List<TestRow> batch = AuthorityPipelineWorkRepositoryCore.TenantRoundRobinEligibleBatch(
            rows,
            take: 2,
            static row => row.TenantId,
            static row => row.CreatedUtc,
            static row => row.OutboxId);

        batch.Should().HaveCount(2);
        batch[0].TenantId.Should().Be(tenantA);
        batch[1].TenantId.Should().Be(tenantB);
    }

    private sealed record TestRow(Guid TenantId, DateTime CreatedUtc, Guid OutboxId);
}
