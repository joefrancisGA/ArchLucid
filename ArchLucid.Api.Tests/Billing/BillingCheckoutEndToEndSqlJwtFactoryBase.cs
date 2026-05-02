using System.Security.Cryptography;
using System.Text;

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
    protected string PrivatePemPath => _privatePemPath;

    protected sealed override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureAppConfiguration(
            (_, config) => config.AddInMemoryCollection(BuildJwtAndBillingConfigurationOverrides()));

        builder.ConfigureTestServices(ConfigureEndToEndServices);
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
            TryDeleteFile(_privatePemPath);
            TryDeleteFile(_publicPemPath);
        }

        base.Dispose(disposing);
    }

    private Dictionary<string, string?> BuildJwtAndBillingConfigurationOverrides()
    {
        Dictionary<string, string?> jwt = new()
        {
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "",
            ["ArchLucidAuth:Audience"] = "",
            ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = _publicPemPath,
            ["ArchLucidAuth:JwtLocalIssuer"] = "https://test.archlucid.local",
            ["ArchLucidAuth:JwtLocalAudience"] = "api://archlucid-jwt-local-test",
            ["Authentication:ApiKey:DevelopmentBypassAll"] = "false",
            ["Auth:Trial:Modes:0"] = "LocalIdentity",
            ["Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath"] = _privatePemPath,
            ["Auth:Trial:LocalIdentity:JwtIssuer"] = "https://test.archlucid.local",
            ["Auth:Trial:LocalIdentity:JwtAudience"] = "api://archlucid-jwt-local-test"
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
