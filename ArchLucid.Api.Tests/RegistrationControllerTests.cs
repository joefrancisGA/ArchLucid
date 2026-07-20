using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>Self-service registration with <see cref="GreenfieldSqlApiFactory" /> (full SQL DI + DbUp + schema bootstrap).</summary>
/// <remarks>
///     Requires a reachable SQL Server (see <c>docs/BUILD.md</c>): on non-Windows set <c>ARCHLUCID_SQL_TEST</c> or
///     <c>ARCHLUCID_API_TEST_SQL</c>.
///     Marked <c>Category=Integration</c> so <c>dotnet test --filter "Suite=Core&amp;Category!=Integration"</c> (fast
///     core, no SQL) skips this class.
/// </remarks>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class RegistrationControllerTests(GreenfieldSqlApiFactory fixture) : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableFact]
    public async Task Register_creates_tenant_then_returns_conflict_for_same_organization()
    {
        using HttpClient client = await fixture.CreateBoundedClientAsync();
        string organizationName = "Reg Org " + Guid.NewGuid().ToString("N");
        string expectedSlug = TenantSlugNormalizer.FromName(organizationName);
        string normalizedName = TenantOrganizationDuplicateDetector.NormalizeOrganizationName(organizationName);

        string diagPath = Path.Combine(Path.GetTempPath(), "archlucid-registration-dup-diag.txt");
        DumpHostSqlConfig(fixture, "before-register", diagPath);

        using HttpResponseMessage created = await client.PostAsync(
            "/v1/register",
            JsonContent(organizationName, "first@example.com", "First User"));

        string createdBody = await created.Content.ReadAsStringAsync();
        AppendDiag(
            diagPath,
            $"first status={(int)created.StatusCode} body={Truncate(createdBody, 500)}");

        created.StatusCode.Should().Be(HttpStatusCode.Created, "first register body: {0}", createdBody);

        Guid firstTenantId;
        using (JsonDocument createdDoc = JsonDocument.Parse(createdBody))
            firstTenantId = createdDoc.RootElement.GetProperty("tenantId").GetGuid();

        TenantRowProbe? rowById = await ProbeTenantByIdAsync(fixture.SqlConnectionString, firstTenantId);
        AppendDiag(
            diagPath,
            "after-first by tenantId="
            + (rowById is null
                ? "NULL (HTTP 201 tenant missing from fixture catalog!)"
                : $"Id={rowById.Id} Name={rowById.Name} Slug={rowById.Slug}"));

        int totalTenants = await CountAllTenantsAsync(fixture.SqlConnectionString);
        AppendDiag(diagPath, $"after-first total dbo.Tenants rows on fixture catalog={totalTenants}");

        string diSystemCatalog;
        TenantRowProbe? rowViaDiFactory;

        // Compare live system factory connection string from DI (frozen at host build) vs fixture.
        using (IServiceScope probeScope = fixture.Services.CreateScope())
        {
            ArchLucid.Persistence.Connections.ISystemSqlConnectionFactory systemFactory =
                probeScope.ServiceProvider.GetRequiredService<ArchLucid.Persistence.Connections.ISystemSqlConnectionFactory>();
            diSystemCatalog = InitialCatalogOrMark(systemFactory.SystemConnectionString);
            AppendDiag(
                diagPath,
                "DI ISystemSqlConnectionFactory.SystemConnectionString catalog=" + diSystemCatalog);

            rowViaDiFactory = await ProbeTenantByIdAsync(
                systemFactory.SystemConnectionString,
                firstTenantId);
            AppendDiag(
                diagPath,
                "after-first by tenantId via DI system factory="
                + (rowViaDiFactory is null
                    ? "NULL"
                    : $"Id={rowViaDiFactory.Id} Name={rowViaDiFactory.Name} Slug={rowViaDiFactory.Slug}"));
        }

        TenantRowProbe? rowOnFixtureCs = await ProbeTenantsAsync(fixture.SqlConnectionString, normalizedName, expectedSlug);
        AppendDiag(
            diagPath,
            "after-first fixture.SqlConnectionString row by name/slug="
            + (rowOnFixtureCs is null
                ? "NULL"
                : $"Id={rowOnFixtureCs.Id} Name={rowOnFixtureCs.Name} Slug={rowOnFixtureCs.Slug}"));

        string? hostArchLucidCs = ResolveHostConnectionString(fixture, "ConnectionStrings:ArchLucid");
        string? hostSystemCs = ResolveHostConnectionString(fixture, "ConnectionStrings:ArchLucidSystem");
        string? hostTopology = ResolveHostConnectionString(fixture, "ArchLucid:SqlTopology:Mode");
        AppendDiag(
            diagPath,
            $"host ArchLucid CS InitialCatalog={InitialCatalogOrMark(hostArchLucidCs)} "
            + $"System CS InitialCatalog={InitialCatalogOrMark(hostSystemCs)} topology={hostTopology}");

        if (!string.IsNullOrWhiteSpace(hostArchLucidCs))
        {
            TenantRowProbe? rowOnHostCs = await ProbeTenantsAsync(hostArchLucidCs, normalizedName, expectedSlug);
            AppendDiag(
                diagPath,
                "after-first host ArchLucid CS row="
                + (rowOnHostCs is null
                    ? "NULL"
                    : $"Id={rowOnHostCs.Id} Name={rowOnHostCs.Name} Slug={rowOnHostCs.Slug}"));
        }

        // Fail fast with catalog evidence when HTTP 201 IDs are invisible to both fixture and DI system CS.
        rowById.Should().NotBeNull(
            "first /v1/register returned 201 tenantId={0} but dbo.Tenants row missing on fixture catalog={1}; "
            + "DI system catalog={2}; viaDiFactory={3}; totalTenants={4}; diag={5}",
            firstTenantId,
            InitialCatalogOrMark(fixture.SqlConnectionString),
            diSystemCatalog,
            rowViaDiFactory is null ? "NULL" : rowViaDiFactory.Id.ToString("D"),
            totalTenants,
            diagPath);

        using HttpResponseMessage duplicate = await client.PostAsync(
            "/v1/register",
            JsonContent(organizationName, "second@example.com", null));

        string duplicateBody = await duplicate.Content.ReadAsStringAsync();
        AppendDiag(diagPath, $"second status={(int)duplicate.StatusCode} body={Truncate(duplicateBody, 500)}");

        if (duplicate.StatusCode == HttpStatusCode.Created)
        {
            TenantRowProbe? rowAfterSecond = await ProbeTenantsAsync(
                fixture.SqlConnectionString,
                normalizedName,
                expectedSlug);
            AppendDiag(
                diagPath,
                "after-second fixture CS tenants matching name/slug probe="
                + (rowAfterSecond is null ? "NULL" : $"Id={rowAfterSecond.Id} Slug={rowAfterSecond.Slug}"));

            int tenantCount = await CountTenantsByNormalizedNameAsync(fixture.SqlConnectionString, normalizedName);
            AppendDiag(
                diagPath,
                $"after-second tenant rows with normalized name={tenantCount} "
                + $"org={organizationName} slug={expectedSlug}");
        }

        AppendDiag(diagPath, $"diag file complete path={diagPath}");

        duplicate.StatusCode.Should().Be(
            HttpStatusCode.Conflict,
            "second register body: {0}; fixtureRowAfterFirst={1}; rowById={2}; viaDi={3}; "
            + "fixtureCatalog={4}; diSystemCatalog={5}; expectedSlug={6}; diag={7}",
            duplicateBody,
            rowOnFixtureCs is null ? "NULL" : rowOnFixtureCs.Id.ToString("D"),
            rowById is null ? "NULL" : rowById.Id.ToString("D"),
            rowViaDiFactory is null ? "NULL" : rowViaDiFactory.Id.ToString("D"),
            InitialCatalogOrMark(fixture.SqlConnectionString),
            diSystemCatalog,
            expectedSlug,
            diagPath);
    }

    /// <summary>
    ///     Isolates <see cref="ITenantProvisioningService" /> from HTTP + trial bootstrap noise.
    ///     If this passes while the HTTP test fails, the bug is in <c>RegistrationController</c> / middleware.
    ///     If this fails the same way, the bug is provision/SQL visibility under the greenfield host.
    /// </summary>
    [SkippableFact]
    public async Task ProvisionAsync_twice_same_organization_sets_WasAlreadyProvisioned()
    {
        _ = await fixture.CreateBoundedClientAsync();
        string organizationName = "Prov Org " + Guid.NewGuid().ToString("N");
        string diagPath = Path.Combine(Path.GetTempPath(), "archlucid-provision-dup-diag.txt");
        File.WriteAllText(diagPath, string.Empty);
        DumpHostSqlConfig(fixture, "provision-before", diagPath);

        using IServiceScope scope = fixture.Services.CreateScope();
        ITenantProvisioningService provisioning =
            scope.ServiceProvider.GetRequiredService<ITenantProvisioningService>();

        TenantProvisioningResult first = await provisioning.ProvisionAsync(
            new TenantProvisioningRequest
            {
                Name = organizationName,
                AdminEmail = "prov-first@example.com",
                Tier = TenantTier.Free,
                AuditActorOverride = "prov-first@example.com"
            },
            CancellationToken.None);

        AppendDiag(
            diagPath,
            $"first WasAlreadyProvisioned={first.WasAlreadyProvisioned} TenantId={first.TenantId:D}");
        first.WasAlreadyProvisioned.Should().BeFalse();

        TenantRowProbe? row = await ProbeTenantsAsync(
            fixture.SqlConnectionString,
            TenantOrganizationDuplicateDetector.NormalizeOrganizationName(organizationName),
            TenantSlugNormalizer.FromName(organizationName));
        AppendDiag(
            diagPath,
            "after-first row="
            + (row is null ? "NULL" : $"Id={row.Id:D} Name={row.Name} Slug={row.Slug}"));
        row.Should().NotBeNull("first ProvisionAsync must persist dbo.Tenants on fixture catalog");

        TenantProvisioningResult second = await provisioning.ProvisionAsync(
            new TenantProvisioningRequest
            {
                Name = organizationName,
                AdminEmail = "prov-second@example.com",
                Tier = TenantTier.Free,
                AuditActorOverride = "prov-second@example.com"
            },
            CancellationToken.None);

        AppendDiag(
            diagPath,
            $"second WasAlreadyProvisioned={second.WasAlreadyProvisioned} TenantId={second.TenantId:D} diag={diagPath}");

        second.WasAlreadyProvisioned.Should().BeTrue(
            "diag={0}; firstTenant={1}; secondTenant={2}; rowAfterFirst={3}",
            diagPath,
            first.TenantId,
            second.TenantId,
            row!.Id);
    }

    [SkippableFact]
    public async Task Register_then_trial_status_returns_active_with_sample_run()
    {
        using HttpClient client = await fixture.CreateBoundedClientAsync();
        string organizationName = "Trial Org " + Guid.NewGuid().ToString("N");

        using HttpResponseMessage created = await client.PostAsync(
            "/v1/register",
            JsonContent(organizationName, "trial@example.com", "Trial User"));

        created.StatusCode.Should().Be(HttpStatusCode.Created);
        using JsonDocument doc = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        Guid tenantId = doc.RootElement.GetProperty("tenantId").GetGuid();
        Guid workspaceId = doc.RootElement.GetProperty("defaultWorkspaceId").GetGuid();
        Guid projectId = doc.RootElement.GetProperty("defaultProjectId").GetGuid();

        using HttpRequestMessage statusReq = new(HttpMethod.Get, "/v1/tenant/trial-status");
        statusReq.Headers.Add("x-tenant-id", tenantId.ToString());
        statusReq.Headers.Add("x-workspace-id", workspaceId.ToString());
        statusReq.Headers.Add("x-project-id", projectId.ToString());
        using HttpResponseMessage status = await client.SendAsync(statusReq);

        status.StatusCode.Should().Be(HttpStatusCode.OK);
        using JsonDocument statusDoc = JsonDocument.Parse(await status.Content.ReadAsStringAsync());
        statusDoc.RootElement.GetProperty("status").GetString().Should().Be("Active");
        statusDoc.RootElement.GetProperty("trialSampleRunId").GetGuid().Should().NotBeEmpty();
    }

    private static void DumpHostSqlConfig(GreenfieldSqlApiFactory fixture, string label, string diagPath)
    {
        using IServiceScope scope = fixture.Services.CreateScope();
        IConfiguration config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        AppendDiag(
            diagPath,
            $"{label} env ConnectionStrings__ArchLucid catalog="
            + InitialCatalogOrMark(Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")));
        AppendDiag(
            diagPath,
            $"{label} env ConnectionStrings__ArchLucidSystem catalog="
            + InitialCatalogOrMark(Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucidSystem")));
        AppendDiag(
            diagPath,
            $"{label} env ArchLucid__SqlTopology__Mode="
            + Environment.GetEnvironmentVariable("ArchLucid__SqlTopology__Mode"));
        AppendDiag(
            diagPath,
            $"{label} fixture.SqlConnectionString catalog="
            + InitialCatalogOrMark(fixture.SqlConnectionString));
        AppendDiag(
            diagPath,
            $"{label} IConfiguration ArchLucid catalog="
            + InitialCatalogOrMark(config["ConnectionStrings:ArchLucid"]));
        AppendDiag(
            diagPath,
            $"{label} IConfiguration ArchLucidSystem catalog="
            + InitialCatalogOrMark(config["ConnectionStrings:ArchLucidSystem"]));
        AppendDiag(
            diagPath,
            $"{label} IConfiguration SqlTopology:Mode="
            + config[$"{SqlTopologyOptions.SectionPath}:Mode"]);
    }

    private static void AppendDiag(string diagPath, string line)
    {
        string text = $"[RegistrationDupDiag] {line}";
        Console.Error.WriteLine(text);
        File.AppendAllText(diagPath, text + Environment.NewLine);
    }

    private static string? ResolveHostConnectionString(GreenfieldSqlApiFactory fixture, string key)
    {
        using IServiceScope scope = fixture.Services.CreateScope();
        IConfiguration config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        return config[key];
    }

    private static async Task<TenantRowProbe?> ProbeTenantsAsync(
        string connectionString,
        string normalizedName,
        string slug)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        return await connection.QuerySingleOrDefaultAsync<TenantRowProbe>(
            """
            SELECT TOP (1) Id, Name, Slug
            FROM dbo.Tenants
            WHERE UPPER(LTRIM(RTRIM(Name))) = @NormalizedName
               OR LOWER(LTRIM(RTRIM(Slug))) = @Slug
            ORDER BY CreatedUtc DESC;
            """,
            new { NormalizedName = normalizedName, Slug = slug.Trim().ToLowerInvariant() });
    }

    private static async Task<TenantRowProbe?> ProbeTenantByIdAsync(string connectionString, Guid tenantId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        return await connection.QuerySingleOrDefaultAsync<TenantRowProbe>(
            """
            SELECT Id, Name, Slug
            FROM dbo.Tenants
            WHERE Id = @TenantId;
            """,
            new { TenantId = tenantId });
    }

    private static async Task<int> CountAllTenantsAsync(string connectionString)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        return await connection.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.Tenants;");
    }

    private static async Task<int> CountTenantsByNormalizedNameAsync(string connectionString, string normalizedName)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        return await connection.ExecuteScalarAsync<int>(
            """
            SELECT COUNT(1)
            FROM dbo.Tenants
            WHERE UPPER(LTRIM(RTRIM(Name))) = @NormalizedName;
            """,
            new { NormalizedName = normalizedName });
    }

    private static string InitialCatalogOrMark(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return "<null>";

        try
        {
            return new SqlConnectionStringBuilder(connectionString).InitialCatalog;
        }
        catch (ArgumentException)
        {
            return "<unparseable>";
        }
    }

    private static string Truncate(string value, int max)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= max)
            return value;

        return value[..max] + "...";
    }

    private static StringContent JsonContent(string organizationName, string adminEmail, string? displayName)
    {
        Dictionary<string, string?> payload = new()
        {
            ["organizationName"] = organizationName,
            ["adminEmail"] = adminEmail
        };

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            payload["adminDisplayName"] = displayName;
        }

        string json = JsonSerializer.Serialize(payload);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private sealed class TenantRowProbe
    {
        public Guid Id
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = "";

        public string Slug
        {
            get;
            init;
        } = "";
    }
}
