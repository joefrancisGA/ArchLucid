using System.Security.Claims;

using ArchLucid.Host.Core.Auth.Services;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class NoOpRoleSyncServiceTests
{
    [Fact]
    public async Task ApplyEntraJwtAndDirectoryOverridesAsync_completes_without_mutation()
    {
        NoOpRoleSyncService sut = new();
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        await sut.ApplyEntraJwtAndDirectoryOverridesAsync(principal, CancellationToken.None);
    }

    [Fact]
    public async Task ApplyEntraJwtAndDirectoryOverridesAsync_throws_when_principal_null()
    {
        NoOpRoleSyncService sut = new();

        Func<Task> act = async () =>
            await sut.ApplyEntraJwtAndDirectoryOverridesAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task ApplyEntraJwtAndDirectoryOverridesAsync_honors_cancellation()
    {
        NoOpRoleSyncService sut = new();
        ClaimsPrincipal principal = new(new ClaimsIdentity());
        CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = async () =>
            await sut.ApplyEntraJwtAndDirectoryOverridesAsync(principal, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
