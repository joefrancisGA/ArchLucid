using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Configuration;
using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     In-memory API host with <c>ArchLucidAuth:Mode=JwtBearer</c> and local RSA validation
///     (<c>ArchLucidAuth:JwtSigningPublicKeyPemPath</c>) — mirrors CI live E2E. Not <c>sealed</c> so integration tests can
///     subclass once and combine <see cref="Microsoft.AspNetCore.TestHost.WebHostBuilderExtensions.ConfigureTestServices" />
///     with the same PEM-backed signing key pair.
/// </summary>
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

        // UseSetting merges into host config early so Program's AddArchLucidAuth sees JwtBearer (not appsettings.json DevelopmentBypass).
        builder.UseSetting("ArchLucidAuth:Mode", "JwtBearer");
        builder.UseSetting("ArchLucidAuth:Authority", "");
        builder.UseSetting("ArchLucidAuth:Audience", "");
        builder.UseSetting("ArchLucidAuth:JwtSigningPublicKeyPemPath", _publicPemPath);
        builder.UseSetting("ArchLucidAuth:JwtLocalIssuer", JwtLocalTestIssuer);
        builder.UseSetting("ArchLucidAuth:JwtLocalAudience", JwtLocalTestAudience);
        builder.UseSetting("Authentication:ApiKey:DevelopmentBypassAll", "false");

        // http-only URLs disable HTTPS redirection so TestServer clients keep Authorization headers on redirects
        // (matches ArchLucid.Api.Tests.ArchLucidApiFactory — see AspNetCoreHostingUrls.ShouldUseHttpsRedirection).
        builder.UseSetting("ASPNETCORE_URLS", "http://127.0.0.1:0");

        builder.ConfigureAppConfiguration((_, config) =>
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
            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices((ctx, services) =>
        {
            // #region agent log
            ArchLucidAuthOptions resolvedForLog = ArchLucidAuthConfigurationBridge.Resolve(ctx.Configuration);

            AppendAgentDebugNdjson(
                hypothesisId: "H2",
                location: $"{nameof(JwtLocalSigningWebAppFactory)}.ConfigureServices",
                message: "merged configuration at host build",
                data: new
                {
                    archLucidAuthMode = ctx.Configuration["ArchLucidAuth:Mode"],
                    pemPathLength = (ctx.Configuration["ArchLucidAuth:JwtSigningPublicKeyPemPath"] ?? "").Length,
                    resolvedMode = resolvedForLog.Mode,
                    resolvedPemPathLength = (resolvedForLog.JwtSigningPublicKeyPemPath ?? "").Length
                });
            // #endregion

            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                JwtBearerEvents prior = options.Events ?? new JwtBearerEvents();

                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = async context =>
                    {
                        // #region agent log
                        AppendAgentDebugNdjson(
                            hypothesisId: "H3",
                            location: "JwtBearer.OnAuthenticationFailed",
                            message: context.Exception?.Message ?? "no-exception",
                            data: new { exceptionType = context.Exception?.GetType().Name });
                        // #endregion

                        if (prior.OnAuthenticationFailed is not null)
                            await prior.OnAuthenticationFailed(context);
                    },
                    OnTokenValidated = async context =>
                    {
                        // #region agent log
                        AppendAgentDebugNdjson(
                            hypothesisId: "H4",
                            location: "JwtBearer.OnTokenValidated",
                            message: "token validated",
                            data: new { sub = context.Principal?.FindFirst("sub")?.Value });
                        // #endregion

                        if (prior.OnTokenValidated is not null)
                            await prior.OnTokenValidated(context);
                    }
                };
            });
        });
    }

    /// <summary>Debug-mode NDJSON line (session be41f5) — fold regions in editor; remove after investigation.</summary>
    private static void AppendAgentDebugNdjson(
        string hypothesisId,
        string location,
        string message,
        object? data)
    {
        try
        {
            string logPath =
                Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "debug-be41f5.log"));

            Dictionary<string, object?> payload = new(StringComparer.Ordinal)
            {
                ["sessionId"] = "be41f5",
                ["hypothesisId"] = hypothesisId,
                ["location"] = location,
                ["message"] = message,
                ["data"] = data,
                ["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            File.AppendAllText(logPath, JsonSerializer.Serialize(payload) + Environment.NewLine, Encoding.UTF8);
        }
        catch
        {
            // best-effort — never fail the test host
        }
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
