using ArchLucid.Core.IntegrationSecrets;
using ArchLucid.Host.Core.Configuration.IntegrationSecrets;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Configuration.IntegrationSecrets;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryIntegrationSecretStoreCoverageTests
{
    [Fact]
    public async Task Store_and_writer_round_trip_secret_values()
    {
        InMemoryIntegrationSecretStore store = new();
        InMemoryIntegrationSecretWriter sut = new(store);

        bool upserted = await sut.TryUpsertSecretAsync("oauth-client-secret", "value-1", CancellationToken.None);

        upserted.Should().BeTrue();
        store.TryGet("oauth-client-secret", out string? value).Should().BeTrue();
        value.Should().Be("value-1");
    }

    [Fact]
    public async Task Writer_rejects_blank_name_or_value()
    {
        InMemoryIntegrationSecretStore store = new();
        InMemoryIntegrationSecretWriter sut = new(store);

        Func<Task> missingName = () => sut.TryUpsertSecretAsync("  ", "value", CancellationToken.None);
        Func<Task> missingValue = () => sut.TryUpsertSecretAsync("name", "  ", CancellationToken.None);

        await missingName.Should().ThrowAsync<ArgumentException>();
        await missingValue.Should().ThrowAsync<ArgumentException>();
    }
}
