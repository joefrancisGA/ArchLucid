using ArchLucid.Contracts.Integrations;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Notifications.Teams;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatch5Tests
{
    [Fact]
    public async Task InMemoryTenantNotificationChannelPreferencesRepository_round_trips_per_tenant()
    {
        InMemoryTenantNotificationChannelPreferencesRepository sut = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();

        TenantNotificationChannelPreferencesResponse? missing =
            await sut.GetByTenantAsync(tenantA, CancellationToken.None);
        missing.Should().BeNull();

        TenantNotificationChannelPreferencesResponse? saved = await sut.UpsertAsync(
            tenantA,
            emailCustomerNotificationsEnabled: true,
            teamsCustomerNotificationsEnabled: false,
            outboundWebhookCustomerNotificationsEnabled: true,
            CancellationToken.None);

        saved.Should().NotBeNull();
        saved!.IsConfigured.Should().BeTrue();
        saved.EmailCustomerNotificationsEnabled.Should().BeTrue();
        saved.OutboundWebhookCustomerNotificationsEnabled.Should().BeTrue();

        TenantNotificationChannelPreferencesResponse? loaded =
            await sut.GetByTenantAsync(tenantA, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.TenantId.Should().Be(tenantA);

        await sut.UpsertAsync(
            tenantB,
            emailCustomerNotificationsEnabled: false,
            teamsCustomerNotificationsEnabled: true,
            outboundWebhookCustomerNotificationsEnabled: false,
            CancellationToken.None);

        (await sut.GetByTenantAsync(tenantB, CancellationToken.None))!.TeamsCustomerNotificationsEnabled.Should().BeTrue();
        (await sut.GetByTenantAsync(tenantA, CancellationToken.None))!.EmailCustomerNotificationsEnabled.Should().BeTrue();
    }

    [Fact]
    public async Task InMemoryTenantTeamsIncomingWebhookConnectionRepository_preserves_triggers_on_null_update()
    {
        InMemoryTenantTeamsIncomingWebhookConnectionRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        IReadOnlyList<string> customTriggers = [IntegrationEventTypes.AuthorityRunCompletedV1];

        TeamsIncomingWebhookConnectionResponse? created = await sut.UpsertAsync(
            tenantId,
            "kv-secret",
            "ops",
            customTriggers,
            CancellationToken.None);

        created.Should().NotBeNull();
        created!.EnabledTriggers.Should().BeEquivalentTo(customTriggers);

        TeamsIncomingWebhookConnectionResponse? updated = await sut.UpsertAsync(
            tenantId,
            "kv-secret-2",
            "ops-2",
            enabledTriggers: null,
            CancellationToken.None);

        updated!.EnabledTriggers.Should().BeEquivalentTo(customTriggers);
        updated.KeyVaultSecretName.Should().Be("kv-secret-2");

        (await sut.DeleteAsync(tenantId, CancellationToken.None)).Should().BeTrue();
        (await sut.GetAsync(tenantId, CancellationToken.None)).Should().BeNull();
        (await sut.DeleteAsync(tenantId, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task InMemoryTenantTeamsIncomingWebhookConnectionRepository_uses_catalog_defaults_for_new_rows()
    {
        InMemoryTenantTeamsIncomingWebhookConnectionRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        TeamsIncomingWebhookConnectionResponse? created = await sut.UpsertAsync(
            tenantId,
            "kv-secret",
            label: null,
            enabledTriggers: null,
            CancellationToken.None);

        created!.EnabledTriggers.Should().BeEquivalentTo(TeamsNotificationTriggerCatalog.All);
    }

    [Fact]
    public void AuthenticationProviderTypeMapper_round_trips_provider_and_membership_enums()
    {
        AuthenticationProviderTypeMapper.ToStorageString(AuthenticationProviderType.TenantOidc)
            .Should().Be("TenantOidc");
        AuthenticationProviderTypeMapper.Parse("MicrosoftIdentity")
            .Should().Be(AuthenticationProviderType.MicrosoftIdentity);

        AuthenticationProviderTypeMapper.PlatformUserStatusToStorage(PlatformUserStatus.Suspended)
            .Should().Be("Suspended");
        AuthenticationProviderTypeMapper.ParsePlatformUserStatus("Disabled")
            .Should().Be(PlatformUserStatus.Disabled);

        AuthenticationProviderTypeMapper.WorkspaceMembershipStatusToStorage(WorkspaceMembershipStatus.Revoked)
            .Should().Be("Revoked");
        AuthenticationProviderTypeMapper.ParseWorkspaceMembershipStatus("Active")
            .Should().Be(WorkspaceMembershipStatus.Active);

        Guid tenantId = Guid.NewGuid();
        Guid providerId = Guid.NewGuid();
        string scopeKey = AuthenticationProviderTypeMapper.BuildIdentityScopeKey(tenantId, providerId);
        scopeKey.Should().Contain(tenantId.ToString("D"));
        scopeKey.Should().Contain(providerId.ToString("D"));

        Action badProvider = () => AuthenticationProviderTypeMapper.ToStorageString((AuthenticationProviderType)999);
        badProvider.Should().Throw<ArgumentOutOfRangeException>();
    }
}
