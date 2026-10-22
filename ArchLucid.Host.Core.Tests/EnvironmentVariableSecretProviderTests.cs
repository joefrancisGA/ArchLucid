using ArchLucid.Host.Core.Configuration.Secrets;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EnvironmentVariableSecretProviderTests
{
    [Fact]
    public async Task GetSecretAsync_returns_trimmed_value_when_present()
    {
        const string keyName = "MySecretKey";
        ConfigurationManager configuration = new();
        configuration[keyName] = "  secret-value  ";

        EnvironmentVariableSecretProvider sut = new(configuration);

        string? secret = await sut.GetSecretAsync(keyName, CancellationToken.None);

        secret.Should().Be("  secret-value  ");
    }

    [Fact]
    public async Task GetSecretAsync_returns_null_when_missing_or_whitespace()
    {
        ConfigurationManager configuration = new();
        configuration["Empty"] = "   ";

        EnvironmentVariableSecretProvider sut = new(configuration);

        string? missing = await sut.GetSecretAsync("NoSuch", CancellationToken.None);
        string? empty = await sut.GetSecretAsync("Empty", CancellationToken.None);

        missing.Should().BeNull();
        empty.Should().BeNull();
    }

    [Fact]
    public async Task GetSecretAsync_throws_on_blank_name()
    {
        ConfigurationManager configuration = new();
        EnvironmentVariableSecretProvider sut = new(configuration);

        Func<Task> act = async () => await sut.GetSecretAsync(" ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public void Ctor_throws_when_configuration_null()
    {
        Action act = () => new EnvironmentVariableSecretProvider(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
