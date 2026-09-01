using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

/// <summary>
///     <see cref="DapperAuthenticationIdentityLinkProposalRepository" /> against SQL
///     (<c>dbo.AuthenticationIdentityLinkProposals</c>).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class DapperAuthenticationIdentityLinkProposalRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task UpdateStatusAsync_does_not_overwrite_terminal_status()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperAuthenticationIdentityLinkProposalRepository sut = new(factory);
        Guid id = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        await sut.InsertAsync(
            new AuthenticationIdentityLinkProposalRecord
            {
                Id = id,
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.TenantOidc,
                NormalizedIssuer = "https://login.example",
                Subject = "sub-sql-guard",
                Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,
                CreatedUtc = now,
                ExpiresUtc = now.AddHours(1),
            },
            CancellationToken.None);

        bool firstUpdate = await sut.TryUpdateStatusAsync(
            id,
            AuthenticationIdentityLinkProposalStatus.Confirmed,
            now.AddMinutes(1),
            CancellationToken.None);

        bool secondUpdate = await sut.TryUpdateStatusAsync(
            id,
            AuthenticationIdentityLinkProposalStatus.Cancelled,
            now.AddMinutes(2),
            CancellationToken.None);

        AuthenticationIdentityLinkProposalRecord? record = await sut.GetByIdAsync(id, CancellationToken.None);

        firstUpdate.Should().BeTrue();
        secondUpdate.Should().BeFalse();
        record.Should().NotBeNull();
        record!.Status.Should().Be(AuthenticationIdentityLinkProposalStatus.Confirmed);
        record.CancelledUtc.Should().BeNull();
    }
}
