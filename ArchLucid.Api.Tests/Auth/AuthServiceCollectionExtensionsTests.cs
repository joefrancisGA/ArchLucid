using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthServiceCollectionExtensionsTests
{
    [Fact]
    public void AddArchLucidAuth_with_generic_oidc_authority_configures_jwt_bearer_with_jwks_discovery_and_role_mapping()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:Authority"] = "https://generic-oidc.local/",
                ["ArchLucidAuth:Audience"] = "test-api"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();

        services.AddArchLucidAuth(configuration);

        var sp = services.BuildServiceProvider();

        // Verify the JwtBearerOptions configured by the extension
        var optionsMonitor = sp.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
        var jwtOptions = optionsMonitor.Get(JwtBearerDefaults.AuthenticationScheme);

        jwtOptions.Authority.Should().Be("https://generic-oidc.local/");
        jwtOptions.Audience.Should().Be("test-api");

        // When Authority is set and no explicit MetadataAddress/ConfigurationManager is provided,
        // ASP.NET Core JwtBearerHandler will automatically append .well-known/openid-configuration for JWKS discovery.

        // Verify Role mapping configuration
        jwtOptions.TokenValidationParameters.RoleClaimType.Should().Be("roles");

        // Verify composite claims transformation runs role + custom-role mappers in order.
        IClaimsTransformation claimsTransformation = sp.GetRequiredService<IClaimsTransformation>();
        claimsTransformation.Should().BeOfType<CompositeClaimsTransformation>();
    }

    /// <summary>
    /// Regression: Pem-backed signing selects Jwt bearer even when nominal <see cref="ArchLucidAuthOptions.Mode" /> = ApiKey
    /// (appsettings.json default) so Bearer tokens validate instead of failing with Unauthorized on the ApiKey scheme.
    /// </summary>
    [Fact]
    public void AddArchLucidAuth_with_api_key_mode_and_local_public_key_registers_jwt_bearer()
    {
        string pemPath = Path.Combine(Path.GetTempPath(), $"archlucid-auth-ext-pem-{Guid.NewGuid():N}.pem");

        try
        {
            using (RSA rsa = RSA.Create(1024))
            {
                File.WriteAllText(pemPath, rsa.ExportSubjectPublicKeyInfoPem(), System.Text.Encoding.UTF8);
            }

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["ArchLucidAuth:Mode"] = "ApiKey",
                        ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = pemPath,
                        ["ArchLucidAuth:JwtLocalIssuer"] = "https://issuer.auth-ext.test.local",
                        ["ArchLucidAuth:JwtLocalAudience"] = "api://archlucid-auth-ext-test"
                    })
                .Build();

            ServiceCollection services = new();
            services.AddLogging();
            services.AddArchLucidAuth(configuration);

            using ServiceProvider sp = services.BuildServiceProvider();
            IOptionsMonitor<JwtBearerOptions> optionsMonitor =
                sp.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
            JwtBearerOptions jwtOptions = optionsMonitor.Get(JwtBearerDefaults.AuthenticationScheme);

            jwtOptions.TokenValidationParameters.ValidateIssuerSigningKey.Should().BeTrue();
            jwtOptions.TokenValidationParameters.IssuerSigningKey.Should().NotBeNull();
            jwtOptions.TokenValidationParameters.ValidIssuer.Should().Be("https://issuer.auth-ext.test.local");
            jwtOptions.TokenValidationParameters.ValidAudience.Should().Be("api://archlucid-auth-ext-test");
            jwtOptions.TokenValidationParameters.RoleClaimType.Should().Be("roles");
        }
        finally
        {
            try
            {
                if (File.Exists(pemPath))
                    File.Delete(pemPath);
            }
            catch
            {
                // Best-effort — temp cleanup on build agents.
            }
        }
    }

    /// <summary>
    ///     Regression: tokens minted like <see cref="JwtLocalSigningIntegrationTestTokens" /> must validate against
    ///     <see cref="AddArchLucidAuth" /> PEM settings (CI 401 on Teams/JWT integration tests).
    /// </summary>
    [Fact]
    public void AddArchLucidAuth_local_pem_validates_minted_jwt_from_matching_key_pair()
    {
        using RSA rsa = RSA.Create(2048);
        string privatePem = rsa.ExportPkcs8PrivateKeyPem();
        string publicPemPath = Path.Combine(Path.GetTempPath(), $"archlucid-auth-mint-pem-{Guid.NewGuid():N}.pem");

        try
        {
            File.WriteAllText(publicPemPath, rsa.ExportSubjectPublicKeyInfoPem(), System.Text.Encoding.UTF8);

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["ArchLucidAuth:Mode"] = "JwtBearer",
                        ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = publicPemPath,
                        ["ArchLucidAuth:JwtLocalIssuer"] = JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
                        ["ArchLucidAuth:JwtLocalAudience"] = JwtLocalSigningWebAppFactory.JwtLocalTestAudience
                    })
                .Build();

            ServiceCollection services = new();
            services.AddLogging();
            services.AddArchLucidAuth(configuration);

            using ServiceProvider serviceProvider = services.BuildServiceProvider();
            IOptionsMonitor<JwtBearerOptions> optionsMonitor =
                serviceProvider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
            TokenValidationParameters parameters =
                optionsMonitor.Get(JwtBearerDefaults.AuthenticationScheme).TokenValidationParameters;

            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
                privatePem,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
                JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "OperatorUser",
                [ArchLucidRoles.Operator]);

            JwtSecurityTokenHandler handler = new();
            handler.Invoking(h => h.ValidateToken(token, parameters, out _))
                .Should()
                .NotThrow();
        }
        finally
        {
            try
            {
                if (File.Exists(publicPemPath))
                    File.Delete(publicPemPath);
            }
            catch
            {
                // Best-effort — temp cleanup on build agents.
            }
        }
    }
}
