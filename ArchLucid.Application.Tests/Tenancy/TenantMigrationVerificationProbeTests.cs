using ArchLucid.Application;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TenantMigrationVerificationProbeTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task RunAsync_fails_when_write_freeze_is_not_active()
    {
        TenantMigrationVerificationProbe sut = CreateProbe(
            tenant: ActiveTenant(suspendedUtc: null),
            committedRuns: [new ReferenceEvidenceRunCandidate { RunId = Guid.NewGuid() }]);

        TenantMigrationVerificationProbeResult result = await sut.RunAsync(TenantId, CancellationToken.None);

        Assert.False(result.Passed);
        Assert.Contains("write freeze", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RunAsync_passes_when_tenant_is_suspended_and_committed_run_loads()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Mock<IRunDetailQueryService> runDetail = new(MockBehavior.Strict);
        runDetail
            .Setup(service => service.GetRunDetailForRollupAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail());

        TenantMigrationVerificationProbe sut = CreateProbe(
            tenant: ActiveTenant(suspendedUtc: DateTimeOffset.UtcNow),
            committedRuns: [new ReferenceEvidenceRunCandidate { RunId = runId }],
            runDetailQueryService: runDetail.Object);

        TenantMigrationVerificationProbeResult result = await sut.RunAsync(TenantId, CancellationToken.None);

        Assert.True(result.Passed);
        Assert.True(result.WriteFreezeVerified);
        Assert.True(result.AuthorizationBoundaryVerified);
        Assert.Equal(runId.ToString("N"), result.ProbeRunId);
    }

    [Fact]
    public async Task RunAsync_fails_when_committed_run_detail_is_null()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Mock<IRunDetailQueryService> runDetail = new(MockBehavior.Strict);
        runDetail
            .Setup(service => service.GetRunDetailForRollupAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        TenantMigrationVerificationProbe sut = CreateProbe(
            tenant: ActiveTenant(suspendedUtc: DateTimeOffset.UtcNow),
            committedRuns:
            [
                new ReferenceEvidenceRunCandidate
                {
                    RunId = runId,
                    WorkspaceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    ScopeProjectId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                },
            ],
            runDetailQueryService: runDetail.Object);

        TenantMigrationVerificationProbeResult result = await sut.RunAsync(TenantId, CancellationToken.None);

        Assert.False(result.Passed);
        Assert.Contains("could not be loaded", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    private static TenantMigrationVerificationProbe CreateProbe(
        TenantRecord? tenant,
        IReadOnlyList<ReferenceEvidenceRunCandidate> committedRuns,
        IRunDetailQueryService? runDetailQueryService = null)
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        Mock<ITenantIdentityProviderConfigurationRepository> identityProviders = new(MockBehavior.Strict);
        identityProviders
            .Setup(repository => repository.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantIdentityProviderConfigurationRecord?)null);

        Mock<IReferenceEvidenceRunLookup> runs = new(MockBehavior.Strict);
        runs
            .Setup(lookup => lookup.ListRecentCommittedRunsAsync(TenantId, 1, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(committedRuns);

        Mock<IRunDetailQueryService> runDetail = new(MockBehavior.Strict);
        if (runDetailQueryService is not null)
        {
            return new TenantMigrationVerificationProbe(
                tenants.Object,
                identityProviders.Object,
                runs.Object,
                runDetailQueryService);
        }

        return new TenantMigrationVerificationProbe(
            tenants.Object,
            identityProviders.Object,
            runs.Object,
            runDetail.Object);
    }

    private static TenantRecord ActiveTenant(DateTimeOffset? suspendedUtc) =>
        new()
        {
            Id = TenantId,
            Slug = "tenant-a",
            Name = "Tenant A",
            SuspendedUtc = suspendedUtc,
        };
}
