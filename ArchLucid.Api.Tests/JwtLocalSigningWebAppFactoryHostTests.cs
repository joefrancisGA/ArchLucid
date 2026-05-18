using System.IdentityModel.Tokens.Jwt;

using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Tests;

/// <summary>Guards <see cref="JwtLocalSigningWebAppFactory" /> PEM/Jwt host wiring (401 regressions).</summary>
[Trait("Category", "Unit")]
public sealed class JwtLocalSigningWebAppFactoryHostTests : IDisposable
{
    private readonly JwtLocalSigningWebAppFactory _factory = new();

    [Fact]
    public void Host_registers_local_pem_jwt_bearer_validation_parameters()
    {
        IOptionsMonitor<JwtBearerOptions> monitor = _factory.Services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
        JwtBearerOptions jwtOptions = monitor.Get(JwtBearerDefaults.AuthenticationScheme);

        jwtOptions.TokenValidationParameters.ValidateIssuerSigningKey.Should().BeTrue();
        jwtOptions.TokenValidationParameters.IssuerSigningKey.Should().NotBeNull();
        jwtOptions.TokenValidationParameters.ValidIssuer.Should().Be(JwtLocalSigningWebAppFactory.JwtLocalTestIssuer);
        jwtOptions.TokenValidationParameters.ValidAudience.Should().Be(JwtLocalSigningWebAppFactory.JwtLocalTestAudience);
        jwtOptions.TokenValidationParameters.RoleClaimType.Should().Be("roles");
    }

    [Fact]
    public void Minted_operator_jwt_validates_against_host_jwt_bearer_parameters()
    {
        string token = _factory.MintLocalBearerJwt("OperatorUser", [ArchLucidRoles.Operator]);

        IOptionsMonitor<JwtBearerOptions> monitor = _factory.Services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
        TokenValidationParameters parameters = monitor.Get(JwtBearerDefaults.AuthenticationScheme).TokenValidationParameters;

        JwtSecurityTokenHandler handler = new();
        handler.Invoking(h => h.ValidateToken(token, parameters, out _))
            .Should()
            .NotThrow();
    }

    public void Dispose()
    {
        _factory.Dispose();
    }
}
