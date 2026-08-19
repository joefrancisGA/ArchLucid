using ArchLucid.Core.Notifications.Teams;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Notifications.Teams;
[Trait("Category", "Unit")]

public sealed class TeamsIncomingWebhookConnectionUpsertValidationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryValidateKeyVaultSecretName_rejects_missing(string? value)
    {
        bool ok = TeamsIncomingWebhookConnectionUpsertValidation.TryValidateKeyVaultSecretName(
            value,
            out string? trimmed,
            out string? error);

        ok.Should().BeFalse();
        trimmed.Should().BeNull();
        error.Should().Be(TeamsIncomingWebhookConnectionUpsertValidation.KeyVaultSecretNameRequiredMessage);
    }

    [Theory]
    [InlineData("https://example.invalid/hook")]
    [InlineData("http://localhost/webhook")]
    [InlineData("  https://teams.example/hooks/1  ")]
    public void TryValidateKeyVaultSecretName_rejects_url_shapes(string value)
    {
        bool ok = TeamsIncomingWebhookConnectionUpsertValidation.TryValidateKeyVaultSecretName(
            value,
            out string? trimmed,
            out string? error);

        ok.Should().BeFalse();
        trimmed.Should().Be(value.Trim());
        error.Should().Be(TeamsIncomingWebhookConnectionUpsertValidation.RawWebhookUrlRejectedMessage);
    }

    [Theory]
    [InlineData("teams-incoming-webhook-demo")]
    [InlineData("kv-teams-webhook-ref")]
    [InlineData("  kv-ref-with-spaces  ")]
    public void TryValidateKeyVaultSecretName_accepts_secret_name_references(string value)
    {
        bool ok = TeamsIncomingWebhookConnectionUpsertValidation.TryValidateKeyVaultSecretName(
            value,
            out string? trimmed,
            out string? error);

        ok.Should().BeTrue();
        trimmed.Should().Be(value.Trim());
        error.Should().BeNull();
    }
}
