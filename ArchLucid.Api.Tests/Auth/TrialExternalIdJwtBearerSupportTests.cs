using System.IdentityModel.Tokens.Jwt;

using ArchLucid.Api.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TrialExternalIdJwtBearerSupportTests
{
    [Fact]
    public void TryAllowConsumerIdentityIssuers_no_op_when_trial_external_id_disabled()
    {
        JwtBearerOptions options = CreateOptionsWithStrictValidator();
        IssuerValidator priorValidator = options.TokenValidationParameters.IssuerValidator!;

        TrialExternalIdJwtBearerSupport.TryAllowConsumerIdentityIssuers(options, trialExternalIdEnabled: false);

        options.TokenValidationParameters.IssuerValidator.Should().BeSameAs(priorValidator);
    }

    [Fact]
    public void TryAllowConsumerIdentityIssuers_no_op_when_prior_validator_missing()
    {
        JwtBearerOptions options = new()
        {
            TokenValidationParameters = new TokenValidationParameters(),
        };

        TrialExternalIdJwtBearerSupport.TryAllowConsumerIdentityIssuers(options, trialExternalIdEnabled: true);

        options.TokenValidationParameters.IssuerValidator.Should().BeNull();
    }

    [Fact]
    public void TryAllowConsumerIdentityIssuers_accepts_ciam_issuer_without_calling_prior_validator()
    {
        JwtBearerOptions options = CreateOptionsWithStrictValidator();
        bool priorCalled = false;
        options.TokenValidationParameters.IssuerValidator = (issuer, token, parameters) =>
        {
            priorCalled = true;

            return StrictIssuerValidator(issuer, token, parameters);
        };

        TrialExternalIdJwtBearerSupport.TryAllowConsumerIdentityIssuers(options, trialExternalIdEnabled: true);

        string ciamIssuer = "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/v2.0";
        string validated = options.TokenValidationParameters.IssuerValidator!(
            ciamIssuer,
            new JwtSecurityToken(),
            options.TokenValidationParameters);

        validated.Should().Be(ciamIssuer);
        priorCalled.Should().BeFalse();
    }

    [Fact]
    public void TryAllowConsumerIdentityIssuers_delegates_non_ciam_issuer_to_prior_validator()
    {
        JwtBearerOptions options = CreateOptionsWithStrictValidator();

        TrialExternalIdJwtBearerSupport.TryAllowConsumerIdentityIssuers(options, trialExternalIdEnabled: true);

        string entraIssuer = "https://login.microsoftonline.com/tenant/v2.0";
        string validated = options.TokenValidationParameters.IssuerValidator!(
            entraIssuer,
            new JwtSecurityToken(),
            options.TokenValidationParameters);

        validated.Should().Be("strict-ok");
    }

    [Fact]
    public void TryAllowConsumerIdentityIssuers_does_not_disable_signature_validation_parameters()
    {
        JwtBearerOptions options = new()
        {
            TokenValidationParameters = new TokenValidationParameters
            {
                IssuerValidator = StrictIssuerValidator,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey("01234567890123456789012345678901"u8.ToArray()),
            },
        };

        TrialExternalIdJwtBearerSupport.TryAllowConsumerIdentityIssuers(options, trialExternalIdEnabled: true);

        options.TokenValidationParameters.ValidateIssuerSigningKey.Should().BeTrue();
        options.TokenValidationParameters.IssuerSigningKey.Should().NotBeNull();
    }

    private static JwtBearerOptions CreateOptionsWithStrictValidator() =>
        new()
        {
            TokenValidationParameters = new TokenValidationParameters
            {
                IssuerValidator = StrictIssuerValidator,
            },
        };

    private static string StrictIssuerValidator(
        string issuer,
        SecurityToken securityToken,
        TokenValidationParameters validationParameters) =>
        "strict-ok";
}
