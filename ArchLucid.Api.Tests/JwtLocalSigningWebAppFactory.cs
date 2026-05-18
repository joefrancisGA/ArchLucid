using System.Security.Cryptography;
using System.Text;

using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     In-memory API host with <c>ArchLucidAuth:Mode=JwtBearer</c> and local RSA validation
///     (<c>ArchLucidAuth:JwtSigningPublicKeyPemPath</c>) — mirrors CI live E2E. Not <c>sealed</c> so integration tests can
///     subclass once and combine <see cref="Microsoft.AspNetCore.TestHost.WebHostBuilderExtensions.ConfigureTestServices" />
///     with the same PEM-backed signing key pair.
/// </summary>
/// <remarks>
///     Uses <see cref="IWebHostBuilder.UseConfiguration" /> plus late
///     <see cref="IConfigurationBuilder" /> overrides (same pattern as
///     <see cref="HealthEndpointSecurityApiFactory" />) so minimal-hosting
///     <c>Program</c> sees PEM/Jwt settings before <c>AddArchLucidAuth</c> — <c>UseSetting</c> alone can lose to
///     <c>appsettings.Development.json</c> and yield <c>401</c> on otherwise valid Bearer tokens.
/// </remarks>
public class JwtLocalSigningWebAppFactory : WebApplicationFactory<Program>
{
    /// <summary>
    ///     Literal <c>iss</c> wired into this factory's host — must match <see cref="JwtLocalSigningIntegrationTests" />.
    /// </summary>
    /// <remarks>
    ///     Do not derive iss/aud from <see cref="Microsoft.Extensions.Configuration.IConfiguration" /> at mint time:
    ///     binding order / duplicate keys across providers can theoretically diverge from JwtBearer post-configuration,
    ///     yielding <c>401</c> on otherwise valid PEM-signed tokens.
    /// </remarks>
    public const string JwtLocalTestIssuer = "https://test.archlucid.local";

    /// <summary>Literal <c>aud</c> wired into this factory's host (pair of <see cref="JwtLocalTestIssuer" />).</summary>
    public const string JwtLocalTestAudience = "api://archlucid-jwt-local-test";

    private readonly string _publicPemPath;

    public JwtLocalSigningWebAppFactory()
    {
        using RSA rsa = RSA.Create(2048);
        PrivatePemForTests = rsa.ExportPkcs8PrivateKeyPem();
        string publicPem = rsa.ExportSubjectPublicKeyInfoPem();
        _publicPemPath = Path.Combine(Path.GetTempPath(), $"archlucid-jwt-local-{Guid.NewGuid():N}.pem");
        File.WriteAllText(_publicPemPath, publicPem, Encoding.UTF8);
    }

    /// <summary>PKCS#8 private key PEM used to mint JWTs in tests (never used by the API host).</summary>
    public string PrivatePemForTests
    {
        get;
    }

    /// <summary>Issues a Bearer JWT validated by this factory's JwtBearer PEM settings.</summary>
    public string MintLocalBearerJwt(string name, IReadOnlyList<string> roles) =>
        JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            PrivatePemForTests,
            JwtLocalTestIssuer,
            JwtLocalTestAudience,
            name,
            roles);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        Dictionary<string, string?> settings = BuildHostConfigurationOverrides();

        IConfiguration bootstrap = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        builder.UseConfiguration(bootstrap);

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(settings);
        });
    }

    /// <summary>Host overrides shared by bootstrap and late configuration providers.</summary>
    protected virtual Dictionary<string, string?> BuildHostConfigurationOverrides()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value,
            ["AgentExecution:Mode"] = "Simulator",
            ["AzureOpenAI:Endpoint"] = "",
            ["AzureOpenAI:ApiKey"] = "",
            ["AzureOpenAI:DeploymentName"] = "",
            ["AzureOpenAI:EmbeddingDeploymentName"] = "",
            ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
            ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
            ["RateLimiting:Expensive:PermitLimit"] = "100000",
            ["RateLimiting:Expensive:WindowMinutes"] = "1",
            ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
            ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "",
            ["ArchLucidAuth:Audience"] = "",
            ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = _publicPemPath,
            ["ArchLucidAuth:JwtLocalIssuer"] = JwtLocalTestIssuer,
            ["ArchLucidAuth:JwtLocalAudience"] = JwtLocalTestAudience,
            ["Authentication:ApiKey:DevelopmentBypassAll"] = "false",
            ["Billing:Provider"] = "Noop",
            ["ASPNETCORE_URLS"] = "http://127.0.0.1:0"
        };

        ApiTestWebHostLogging.AddQuietDefaultLogLevel(settings);

        return settings;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing)
        {
            return;
        }

        try
        {
            if (File.Exists(_publicPemPath))
            {
                File.Delete(_publicPemPath);
            }
        }
        catch
        {
            // best-effort
        }
    }
}
