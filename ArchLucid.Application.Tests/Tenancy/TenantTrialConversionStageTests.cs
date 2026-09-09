using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantTrialConversionStageTests
{
    [Fact]
    public async Task ConvertTrialAsync_when_trial_status_is_lowercase_active_succeeds()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                TrialStatus = "active",
                Tier = TenantTier.Free,
            });
        tenants
            .Setup(r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        tenants.Verify(
            r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
