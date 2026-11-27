using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Suite", "Core")]
public sealed class EntraTenantAllowlistConfigurationTests
{
    private const string DirectoryId = "2d684b1c-e7f5-4da4-ae07-4734d8c27396";

    [Theory]
    [InlineData("invalid")]
    [InlineData(DirectoryId + ", invalid")]
    [InlineData(", ,")]
    public void Rejects_malformed_list_before_configuring_bearer_options(string configuredList)
    {
        JwtBearerOptions options = new();
        JwtBearerEvents originalEvents = options.Events;
        ArchLucidAuthOptions configuration = new()
        {
            MultiTenantEntra = true,
            AllowedEntraTenantIds = configuredList
        };

        InvalidOperationException error = Assert.Throws<InvalidOperationException>(
            () => EntraMultiTenantJwtBearerConfigurator.ApplyIfEnabled(options, configuration));

        Assert.Contains("ArchLucidAuth:AllowedEntraTenantIds", error.Message, StringComparison.Ordinal);
        Assert.Null(options.TokenValidationParameters.IssuerValidator);
        Assert.Same(originalEvents, options.Events);
    }

    [Theory]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData(" " + DirectoryId + ", ", true)]
    public void Preserves_explicitly_unset_or_valid_configuration(string configuredList, bool expectTenantCallback)
    {
        JwtBearerOptions options = new();
        JwtBearerEvents originalEvents = options.Events;
        ArchLucidAuthOptions configuration = new()
        {
            MultiTenantEntra = true,
            AllowedEntraTenantIds = configuredList
        };

        EntraMultiTenantJwtBearerConfigurator.ApplyIfEnabled(options, configuration);

        Assert.NotNull(options.TokenValidationParameters.IssuerValidator);
        Assert.Equal(expectTenantCallback, !ReferenceEquals(originalEvents, options.Events));
    }

    [Fact]
    public void Inactive_multi_tenant_mode_does_not_bind_its_optional_configuration()
    {
        JwtBearerOptions options = new();
        ArchLucidAuthOptions configuration = new() { AllowedEntraTenantIds = "inactive configuration" };

        EntraMultiTenantJwtBearerConfigurator.ApplyIfEnabled(options, configuration);

        Assert.Null(options.TokenValidationParameters.IssuerValidator);
    }
}
