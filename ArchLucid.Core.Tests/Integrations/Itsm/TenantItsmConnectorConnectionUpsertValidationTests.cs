using ArchLucid.Core.Integrations.Itsm;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integrations.Itsm;

[Trait("Category", "Unit")]
public sealed class TenantItsmConnectorConnectionUpsertValidationTests
{
    [Fact]
    public void TryValidateCredentialKeyVaultSecretName_rejects_raw_token_url()
    {
        bool ok = TenantItsmConnectorConnectionUpsertValidation.TryValidateCredentialKeyVaultSecretName(
            "https://example.invalid/token",
            out _,
            out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("raw API tokens");
    }

    [Fact]
    public void TryParseProvider_accepts_jira_and_servicenow()
    {
        TenantItsmConnectorConnectionUpsertValidation.TryParseProvider("jira", out TenantItsmConnectorProvider jira, out _)
            .Should().BeTrue();
        jira.Should().Be(TenantItsmConnectorProvider.Jira);

        TenantItsmConnectorConnectionUpsertValidation.TryParseProvider("ServiceNow", out TenantItsmConnectorProvider snow, out _)
            .Should().BeTrue();
        snow.Should().Be(TenantItsmConnectorProvider.ServiceNow);
    }
}
