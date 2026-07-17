using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PlatformUserAuthVersionValidatorTests
{
    [Fact]
    public async Task ValidateAsync_skips_non_local_issuer_tokens()
    {
        InMemoryPlatformUserRepository users = new();
        PlatformUserAuthVersionValidator sut = CreateSut(users);

        bool valid = await sut.ValidateAsync(
            "https://login.microsoftonline.com/tenant/v2.0",
            Guid.NewGuid().ToString("D"),
            Guid.NewGuid().ToString("D"),
            CancellationToken.None);

        valid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateAsync_rejects_platform_user_tokens_without_auth_version_claim()
    {
        PlatformUserAuthVersionValidator sut = CreateSut(new InMemoryPlatformUserRepository());

        bool valid = await sut.ValidateAsync(
            "https://issuer.test",
            Guid.NewGuid().ToString("D"),
            null,
            CancellationToken.None);

        valid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateAsync_allows_non_guid_local_subjects_without_auth_version_claim()
    {
        PlatformUserAuthVersionValidator sut = CreateSut(new InMemoryPlatformUserRepository());

        bool valid = await sut.ValidateAsync(
            "https://issuer.test",
            "test-sub",
            null,
            CancellationToken.None);

        valid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateAsync_rejects_stale_auth_version()
    {
        InMemoryPlatformUserRepository users = new();
        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "User", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        Guid staleVersion = Guid.NewGuid();

        PlatformUserAuthVersionValidator sut = CreateSut(users);

        bool valid = await sut.ValidateAsync(
            "https://issuer.test",
            user.Id.ToString("D"),
            staleVersion.ToString("D"),
            CancellationToken.None);

        valid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateAsync_accepts_current_auth_version()
    {
        InMemoryPlatformUserRepository users = new();
        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "User", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        PlatformUserAuthVersionValidator sut = CreateSut(users);

        bool valid = await sut.ValidateAsync(
            "https://issuer.test",
            user.Id.ToString("D"),
            user.AuthVersion.ToString("D"),
            CancellationToken.None);

        valid.Should().BeTrue();
    }

    private static PlatformUserAuthVersionValidator CreateSut(IPlatformUserRepository users) =>
        new(
            users,
            Options.Create(
                new TrialAuthOptions
                {
                    LocalIdentity = new TrialLocalIdentityOptions
                    {
                        JwtIssuer = "https://issuer.test"
                    }
                }));
}
