using ArchLucid.Cli.Stack;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchlucidStackKeyVaultSecretNamesTests
{
    [Fact]
    public void HostedPilotSecrets_lists_required_secret_names_without_duplicates()
    {
        IReadOnlyList<string> secrets = ArchlucidStackKeyVaultSecretNames.HostedPilotSecrets;

        secrets.Should().NotBeEmpty();
        secrets.Should().OnlyHaveUniqueItems();
        secrets.Should().Contain("archlucid-sql-connection-string");
        secrets.Should().Contain("archlucid-azure-openai-api-key");
        secrets.Should().Contain("archlucid-webhook-hmac-secret");
    }
}
