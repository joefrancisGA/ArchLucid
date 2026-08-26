using ArchLucid.Application.Advisory;
using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Advisory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WeeklyDigestHealthReaderTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = TenantId,
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetSnapshotAsync_does_not_flag_sponsor_gap_when_sponsor_prefs_are_configured()
    {
        Mock<ITenantExecDigestPreferencesRepository> execPrefs = new();
        execPrefs
            .Setup(r => r.GetByTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ExecDigestPreferencesResponse.Unconfigured(TenantId));

        Mock<ITenantSponsorDigestPreferencesRepository> sponsorPrefs = new();
        sponsorPrefs
            .Setup(r => r.GetByTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorDigestPreferencesResponse
            {
                TenantId = TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["sponsor@example.com"],
            });

        WeeklyDigestHealthReader reader = CreateReader(execPrefs.Object, sponsorPrefs.Object);

        WeeklyDigestHealthSnapshot snapshot = await reader.GetSnapshotAsync(Scope, CancellationToken.None);

        snapshot.SponsorEmailDigestEnabled.Should().BeTrue();
        snapshot.SponsorDigestRecipientCount.Should().Be(1);
        snapshot.ExecutiveEmailDigestEnabled.Should().BeFalse();
        snapshot.SetupGaps.Should().NotContain(g => g.Contains("Sponsor email digest", StringComparison.Ordinal));
        snapshot.SetupGaps.Should().Contain(g => g.Contains("Executive email digest", StringComparison.Ordinal));
    }

    [Fact]
    public async Task GetSnapshotAsync_flags_sponsor_gap_when_sponsor_prefs_are_not_configured()
    {
        Mock<ITenantExecDigestPreferencesRepository> execPrefs = new();
        execPrefs
            .Setup(r => r.GetByTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestPreferencesResponse
            {
                TenantId = TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["exec@example.com"],
            });

        Mock<ITenantSponsorDigestPreferencesRepository> sponsorPrefs = new();
        sponsorPrefs
            .Setup(r => r.GetByTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(SponsorDigestPreferencesResponse.Unconfigured(TenantId));

        WeeklyDigestHealthReader reader = CreateReader(execPrefs.Object, sponsorPrefs.Object);

        WeeklyDigestHealthSnapshot snapshot = await reader.GetSnapshotAsync(Scope, CancellationToken.None);

        snapshot.ExecutiveEmailDigestEnabled.Should().BeTrue();
        snapshot.SponsorEmailDigestEnabled.Should().BeFalse();
        snapshot.SetupGaps.Should().NotContain(g => g.Contains("Executive email digest", StringComparison.Ordinal));
        snapshot.SetupGaps.Should().Contain(g => g.Contains("Sponsor email digest", StringComparison.Ordinal));
    }

    private static WeeklyDigestHealthReader CreateReader(
        ITenantExecDigestPreferencesRepository execDigestPreferencesRepository,
        ITenantSponsorDigestPreferencesRepository sponsorDigestPreferencesRepository)
    {
        Mock<IAdvisoryScanScheduleRepository> schedules = new();
        schedules
            .Setup(r => r.ListByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AdvisoryScanSchedule>());

        Mock<IDigestSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(r => r.ListByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<DigestSubscription>());

        Mock<IArchitectureDigestRepository> digests = new();
        digests
            .Setup(r => r.ListByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureDigest>());

        return new WeeklyDigestHealthReader(
            schedules.Object,
            subscriptions.Object,
            digests.Object,
            execDigestPreferencesRepository,
            sponsorDigestPreferencesRepository);
    }
}
