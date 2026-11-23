using System.Net;
using System.Net.Http.Json;
using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Auth.Models;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using ArchLucid.Core.Scoping;
using FluentAssertions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// Isolated API factory enables the SecureNow exchange only inside this test host.
/// Production feature configuration is untouched.
/// </summary>
public sealed class SecureNowExchangeEnabledApiFactory : ArchLucidApiFactory
{
    protected override void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
        base.ApplySqlCatalogCustomSettings(settings);
        settings["FeatureManagement:SecureNow.ReadOnlySnapshotExchange"] = "true";
    }
}

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowEnabledPersistedHttpTests(SecureNowExchangeEnabledApiFactory factory)
    : IClassFixture<SecureNowExchangeEnabledApiFactory>
{
    [SkippableFact]
    public async Task Persisted_owner_receives_200_and_foreign_tenant_receives_404_with_exchange_enabled()
    {
        using HttpClient owner = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(owner);
        Guid run = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None);
        // Test real FND-010 project entitlement, not a stub or a privileged role bypass.
        // InMemory authority storage and the SQL-backed project role lookup both need
        // the same test-only directory identity; the SQL row enforces the role FK.
        string readerOid = $"fnd011-reader-{Guid.NewGuid():N}";
        owner.DefaultRequestHeaders.TryAddWithoutValidation(
            ArchLucidAuthOptions.TestActorIdHeader, readerOid);
        owner.DefaultRequestHeaders.TryAddWithoutValidation(
            ArchLucidAuthOptions.TestActorRoleHeader, ArchLucidRoles.Reader);

        using (IServiceScope services = factory.Services.CreateScope())
        {
            ScimUserRecord reader = await services.ServiceProvider
                .GetRequiredService<IScimUserRepository>()
                .InsertAsync(
                    ScopeIds.DefaultTenant, readerOid, readerOid, "FND-011 test reader",
                    active: true, resolvedRole: null, ScimResolvedRoleOrigin.Unknown,
                    CancellationToken.None);

            await using SqlConnection sql = new(factory.SqlConnectionString);
            await sql.OpenAsync();
            await using SqlCommand seed = new(
                """
                INSERT INTO dbo.ScimUsers (Id, TenantId, ExternalId, UserName, Active)
                VALUES (@UserId, @TenantId, @Oid, @Oid, 1);
                INSERT INTO dbo.ProjectRoleAssignments (TenantId, WorkspaceId, ProjectId, UserId, Role)
                VALUES (@TenantId, @WorkspaceId, @ProjectId, @UserId, N'Reader');
                """, sql);
            seed.Parameters.AddWithValue("@UserId", reader.Id);
            seed.Parameters.AddWithValue("@TenantId", ScopeIds.DefaultTenant);
            seed.Parameters.AddWithValue("@WorkspaceId", ScopeIds.DefaultWorkspace);
            seed.Parameters.AddWithValue("@ProjectId", ScopeIds.DefaultProject);
            seed.Parameters.AddWithValue("@Oid", readerOid);
            await seed.ExecuteNonQueryAsync();
        }
        string url = $"/v1/evidence-graph/snapshot?runId={run:D}"
            + $"&asOf={Uri.EscapeDataString(DateTimeOffset.UtcNow.AddMinutes(1).ToString("O"))}"
            + "&secureNowExchange=true";

        using HttpResponseMessage allowed = await owner.GetAsync(url);
        allowed.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "the seeded sealed-manifest authority chain must support an authorized snapshot read");
        SecureNowSnapshotEnvelope? envelope =
            await allowed.Content.ReadFromJsonAsync<SecureNowSnapshotEnvelope>();
        envelope.Should().NotBeNull();
        envelope!.RunId.Should().Be(run);
        envelope.TenantId.Should().Be(ScopeIds.DefaultTenant);
        envelope.ReadOnly.Should().BeTrue();

        GreenfieldIntegrationTenantScope.Scope foreignScope =
            GreenfieldIntegrationTenantScope.CreateUniqueScope();
        await GreenfieldIntegrationTenantScope.EnsureScopeAsync(
            factory.SqlConnectionString, foreignScope);
        using HttpClient outsider = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(outsider, foreignScope);

        using HttpResponseMessage denied = await outsider.GetAsync(url);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
