using ArchLucid.Application.Identity;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class UserInvitationFlowServiceTests
{
    [Fact]
    public async Task ValidateTokenPublicAsync_returns_valid_for_pending_invitation()
    {
        InMemoryUserInvitationRepository invitations = new();
        const string token = "invite-token-123";
        Guid tenantId = Guid.NewGuid();

        await invitations.InsertAsync(
            tenantId,
            Guid.NewGuid(),
            "invitee@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        UserInvitationFlowService sut = CreateSut(invitations);

        InvitationPublicValidationResult result =
            await sut.ValidateTokenPublicAsync(token, CancellationToken.None);

        Assert.Equal(InvitationPublicStatus.Valid, result.Status);
        Assert.Equal(ArchLucidRoles.Reader, result.AppRole);
        Assert.True(result.AllowEmailCode);
    }

    [Fact]
    public async Task ValidateTokenPublicAsync_returns_expired_for_stale_pending_invitation()
    {
        InMemoryUserInvitationRepository invitations = new();
        const string token = "expired-token";

        await invitations.InsertAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "invitee@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddMinutes(-5),
            CancellationToken.None);

        UserInvitationFlowService sut = CreateSut(invitations);

        InvitationPublicValidationResult result =
            await sut.ValidateTokenPublicAsync(token, CancellationToken.None);

        Assert.Equal(InvitationPublicStatus.Expired, result.Status);
    }

    [Fact]
    public async Task ValidateTokenPublicAsync_returns_revoked_for_revoked_invitation()
    {
        InMemoryUserInvitationRepository invitations = new();
        const string token = "revoked-token";
        Guid tenantId = Guid.NewGuid();

        UserInvitationRecord row = await invitations.InsertAsync(
            tenantId,
            Guid.NewGuid(),
            "invitee@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        await invitations.RevokeAsync(tenantId, row.Id, DateTimeOffset.UtcNow, CancellationToken.None);

        UserInvitationFlowService sut = CreateSut(invitations);

        InvitationPublicValidationResult result =
            await sut.ValidateTokenPublicAsync(token, CancellationToken.None);

        Assert.Equal(InvitationPublicStatus.Revoked, result.Status);
    }

    [Fact]
    public async Task ValidateTokenPublicAsync_returns_accepted_for_used_invitation()
    {
        InMemoryUserInvitationRepository invitations = new();
        const string token = "used-token";

        UserInvitationRecord row = await invitations.InsertAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "invitee@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        await invitations.MarkAcceptedAsync(row.Id, DateTimeOffset.UtcNow, CancellationToken.None);

        UserInvitationFlowService sut = CreateSut(invitations);

        InvitationPublicValidationResult result =
            await sut.ValidateTokenPublicAsync(token, CancellationToken.None);

        Assert.Equal(InvitationPublicStatus.Accepted, result.Status);
    }

    [Fact]
    public async Task ValidateTokenPublicAsync_masks_invited_email_without_workspace_details()
    {
        InMemoryUserInvitationRepository invitations = new();
        const string token = "mask-token";

        await invitations.InsertAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "alice.smith@contoso.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        UserInvitationFlowService sut = CreateSut(invitations);

        InvitationPublicValidationResult result =
            await sut.ValidateTokenPublicAsync(token, CancellationToken.None);

        Assert.Equal(InvitationPublicStatus.Valid, result.Status);
        Assert.Equal("a***h@contoso.com", result.MaskedInvitedEmail);
        Assert.DoesNotContain("contoso", result.RoutingMessage ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    private static UserInvitationFlowService CreateSut(InMemoryUserInvitationRepository invitations) =>
        new(
            invitations,
            new AuthSignInRoutingService(
                new InMemoryTenantSignInEmailDomainRepository(),
                new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                new InMemoryTenantIdentityProviderConfigurationRepository(),
                    invitations,
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                    TimeProvider.System),
            TimeProvider.System);
}
