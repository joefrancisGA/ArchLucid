using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Application")]
public sealed class TrialLifecycleTransitionEngineDeletedRetryTests
{
    [Fact]
    public async Task TryAdvanceTenantAsync_when_already_deleted_and_purge_deletes_no_rows_returns_success()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord deleted = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTimeOffset.UtcNow,
            TrialStatus = TrialLifecycleStatus.Deleted,
            TrialExpiresUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(deleted);

        Mock<ITenantHardPurgeService> purge = new();
        purge
            .Setup(p => p.PurgeTenantAsync(tenantId, It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 0 });

        Mock<IAuditService> audit = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            TimeProvider.System,
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeTrue();
    }
}
