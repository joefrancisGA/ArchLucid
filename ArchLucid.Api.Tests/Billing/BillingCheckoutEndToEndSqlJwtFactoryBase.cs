using System.Security.Cryptography;
using System.Text;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>
///     Greenfield SQL API host with JWT bearer validation (ArchLucid auth settings) and
///     <c>ILocalTrialJwtIssuer</c>-compatible key material (matches CI E2E-style auth).
/// </summary>
internal abstract class BillingCheckoutEndToEndSqlJwtFactoryBase : GreenfieldSqlApiFactory
{
    private readonly string _privatePemPath;

    private readonly string _publicPemPath;

    private bool _jwtEnvironmentOverridesApplied;

    protected BillingCheckoutEndToEndSqlJwtFactoryBase()
    {
        using RSA rsa = RSA.Create(2048);
        string privatePem = rsa.ExportPkcs8PrivateKeyPem();
        string publicPem = rsa.ExportSubjectPublicKeyInfoPem();
        string stamp = Guid.NewGuid().ToString("N");
        _privatePemPath = Path.Combine(Path.GetTempPath(), $"archlucid-billing-e2e-jwt-priv-{stamp}.pem");
        _publicPemPath = Path.Combine(Path.GetTempPath(), $"archlucid-billing-e2e-jwt-pub-{stamp}.pem");
        File.WriteAllText(_privatePemPath, privatePem, Encoding.UTF8);
        File.WriteAllText(_publicPemPath, publicPem, Encoding.UTF8);
    }

    /// <summary>PKCS#8 private key PEM path configured for <c>Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath</c>.</summary>
    internal string PrivatePemPath => _privatePemPath;

    protected sealed override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Program.AddEnvironmentVariables() runs after appsettings; env must nominate JwtBearer + PEM before AddArchLucidAuth
        // or layered ApiKey / DevelopmentBypass wins and Bearer checkout returns 401 (CI).
        ApplyJwtEnvironmentOverrides();

        base.ConfigureWebHost(builder);

        Dictionary<string, string?> overrides = BuildJwtAndBillingConfigurationOverrides();

        foreach (KeyValuePair<string, string?> pair in overrides)
        {
            if (pair.Value is null)
                continue;

            builder.UseSetting(pair.Key, pair.Value);
        }

        IConfiguration bootstrap = new ConfigurationBuilder().AddInMemoryCollection(overrides).Build();
        builder.UseConfiguration(bootstrap);

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(overrides));

        builder.ConfigureTestServices(services =>
        {
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                ArchLucidAuthOptions authOptions = new()
                {
                    Mode = "JwtBearer",
                    JwtSigningPublicKeyPemPath = _publicPemPath,
                    JwtLocalIssuer = JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
                    JwtLocalAudience = JwtLocalSigningWebAppFactory.JwtLocalTestAudience
                };

                IConfiguration emptyConfiguration = new ConfigurationBuilder().Build();
                ArchLucidJwtBearerConfiguration.Apply(options, authOptions, emptyConfiguration);
                options.TokenValidationParameters.ClockSkew = TimeSpan.FromMinutes(30);
            });

            ConfigureEndToEndServices(services);
        });
    }

    /// <summary>Per-flow billing keys (Stripe vs Azure Marketplace, etc.).</summary>
    protected abstract IReadOnlyDictionary<string, string?> GetBillingConfiguration();

    protected virtual void ConfigureEndToEndServices(IServiceCollection services)
    {
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            ClearJwtEnvironmentOverrides();
            TryDeleteFile(_privatePemPath);
            TryDeleteFile(_publicPemPath);
        }

        base.Dispose(disposing);
    }

    private void ApplyJwtEnvironmentOverrides()
    {
        Environment.SetEnvironmentVariable("ArchLucidAuth__Mode", "JwtBearer");
        Environment.SetEnvironmentVariable("ArchLucidAuth__Authority", string.Empty);
        Environment.SetEnvironmentVariable("ArchLucidAuth__Audience", string.Empty);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtSigningPublicKeyPemPath", _publicPemPath);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalIssuer", JwtLocalSigningWebAppFactory.JwtLocalTestIssuer);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalAudience", JwtLocalSigningWebAppFactory.JwtLocalTestAudience);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__DevelopmentBypassAll", "false");
        _jwtEnvironmentOverridesApplied = true;
    }

    private void ClearJwtEnvironmentOverrides()
    {
        if (!_jwtEnvironmentOverridesApplied)
            return;

        Environment.SetEnvironmentVariable("ArchLucidAuth__Mode", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__Authority", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__Audience", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtSigningPublicKeyPemPath", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalIssuer", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalAudience", null);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__DevelopmentBypassAll", null);
        _jwtEnvironmentOverridesApplied = false;
    }

    private Dictionary<string, string?> BuildJwtAndBillingConfigurationOverrides()
    {
        Dictionary<string, string?> jwt = new()
        {
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "",
            ["ArchLucidAuth:Audience"] = "",
            ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = _publicPemPath,
            ["ArchLucidAuth:JwtLocalIssuer"] = JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            ["ArchLucidAuth:JwtLocalAudience"] = JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            ["Authentication:ApiKey:DevelopmentBypassAll"] = "false",
            ["Auth:Trial:Modes:0"] = "LocalIdentity",
            ["Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath"] = _privatePemPath,
            ["Auth:Trial:LocalIdentity:JwtIssuer"] = JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            ["Auth:Trial:LocalIdentity:JwtAudience"] = JwtLocalSigningWebAppFactory.JwtLocalTestAudience
        };

        foreach (KeyValuePair<string, string?> pair in GetBillingConfiguration())
        {
            jwt[pair.Key] = pair.Value;
        }

        return jwt;
    }

    private static void TryDeleteFile(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            // best-effort
        }
    }
}
