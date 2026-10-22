using ArchLucid.Application.Admin;
using ArchLucid.Application.Identity;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Scim;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class UserInvitationAdminServiceTests
{
    [Fact]
    public async Task InviteAsync_hashes_token_with_invitation_hasher()
    {
        InMemoryUserInvitationRepository invitations = new();
        InMemoryTenantRepository tenants = new();
        Mock<IUserInvitationEmailNotifier> notifier = new();

        notifier
            .Setup(n => n.TrySendInvitationAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Guid tenantId = Guid.NewGuid();

        Mock<IScimUserRepository> scimUsers = new();
        scimUsers
            .Setup(repo => repo.ListAsync(It.IsAny<Guid>(), It.IsAny<Core.Scim.Filtering.ScimFilterNode?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 0));

        Mock<IOptionsMonitor<EmailNotificationOptions>> emailOptions = new();
        emailOptions.Setup(m => m.CurrentValue).Returns(new EmailNotificationOptions { OperatorBaseUrl = "https://app.example.com" });

        UserInvitationAdminService sut = new(
            invitations,
            scimUsers.Object,
            tenants,
            notifier.Object,
            emailOptions.Object,
            TimeProvider.System);

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid() };

        Contracts.Admin.UserInvitationResponse response = await sut.InviteAsync(
            scope,
            "admin@test",
            new Contracts.Admin.CreateUserInvitationRequest
            {
                Email = "invitee@example.com",
                AppRole = ArchLucidRoles.Reader
            },
            CancellationToken.None);

        Assert.False(string.IsNullOrWhiteSpace(response.InvitationToken));
        Assert.Contains("/auth/invite?token=", response.AcceptPath, StringComparison.Ordinal);

        byte[] expectedHash = EmailOtpInvitationTokenHasher.Hash(response.InvitationToken!);
        UserInvitationRecord? stored =
            await invitations.GetPendingByTokenHashAsync(expectedHash, CancellationToken.None);

        Assert.NotNull(stored);
    }
}
