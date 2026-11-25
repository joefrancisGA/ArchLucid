using System.Linq.Expressions;
using System.Net;
using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class TechnologyLedgerControllerAuthorizationHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Requires_current_share_before_manifest_or_ledger_access(bool isRead)
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid();
        const string entryId = "entry-1";
        const string actor = "Technology Ledger share test";
        string? shareRole = isRead ? ArchitectureShareRoles.View : ArchitectureShareRoles.Decide;

        Expression<Func<ScopeContext, bool>> inScope = scope =>
            scope.TenantId == tenant && scope.WorkspaceId == workspace && scope.ProjectId == project;

        Func<ScopeContext, bool> matchesScope = inScope.Compile();

        RunRecord run = new()
        {
            RunId = runId, ArchitectureId = architectureId, TenantId = tenant,
            WorkspaceId = workspace, ScopeProjectId = project,
        };
        ArchitectureIdentityRecord architecture = new()
        {
            ArchitectureId = architectureId, TenantId = tenant, WorkspaceId = workspace,
            ScopeProjectId = project, RestrictToShares = true,
        };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext scope, Guid _, CancellationToken _) => matchesScope(scope) ? run : null);
        Mock<IArchitectureIdentityRepository> architectures = new(MockBehavior.Strict);
        architectures.Setup(r => r.GetByIdAsync(It.Is<ScopeContext>(inScope), architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(architecture);
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IArchitectureShareRepository> shares = new(MockBehavior.Strict);
        shares.Setup(r => r.TryGetAsync(It.Is<ScopeContext>(inScope), architectureId, actor, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => shareRole is { } role
                ? new ArchitectureShareRecord { ArchitectureId = architectureId, ActorOid = actor, Role = role }
                : null);

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(q => q.GetRunDetailAsync(It.Is<ScopeContext>(inScope), runId, It.IsAny<CancellationToken>()))
            .Callback(() => shares.Invocations.Should().ContainSingle())
            .ReturnsAsync(new RunDetailDto
            {
                Run = run,
                GoldenManifest = new ManifestDocument { RunId = runId, ManifestHash = SealedManifestHashTestSupport.DefaultHash },
            });
        Mock<ITechnologyLedgerRunCommandService> ledger = new(MockBehavior.Strict);
        if (isRead)
        {
            ledger.Setup(l => l.GetByRunIdAsync(It.Is<ScopeContext>(inScope), runId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Array.Empty<TechnologyLedgerEntry>());
        }
        else
        {
            ledger.Setup(l => l.PatchEntryAsync(It.Is<ScopeContext>(inScope), runId, entryId,
                    It.Is<PatchTechnologyLedgerEntryCommand>(c => c.IsLocked == true), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TechnologyLedgerEntry { EntryId = entryId, RunId = runId.ToString("N"), IsLocked = true });
        }

        Mock<IAuditService> audit = new();

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(architectures.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(ledger.Object);
            services.AddSingleton(audit.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> SendAsync(Guid t, Guid w, Guid p, string role)
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                actor, [role], t, w, p);
            string path = $"/v1/runs/{runId:D}/technology-ledger";
            if (!isRead)
                path += $"/{entryId}";
            using HttpRequestMessage request = new(isRead ? HttpMethod.Get : HttpMethod.Patch, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", t.ToString("D"));
            request.Headers.Add("x-workspace-id", w.ToString("D"));
            request.Headers.Add("x-project-id", p.ToString("D"));
            if (!isRead)
                request.Content = new StringContent("""{"isLocked":true}""", Encoding.UTF8, "application/json");
            return await client.SendAsync(request);
        }

        if (!isRead)
        {
            using HttpResponseMessage noExecute = await SendAsync(tenant, workspace, project, ArchLucidRoles.Reader);
            noExecute.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            shares.Invocations.Should().BeEmpty();
            authority.VerifyNoOtherCalls();
            ledger.VerifyNoOtherCalls();
            audit.Verify(a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TechnologyLedgerEntryUpdated),
                It.IsAny<CancellationToken>()), Times.Never);
        }

        string authorizedRole = isRead ? ArchLucidRoles.Reader : ArchLucidRoles.Operator;
        using HttpResponseMessage allowed = await SendAsync(tenant, workspace, project, authorizedRole);
        allowed.StatusCode.Should().Be(HttpStatusCode.OK);
        if (isRead)
            (allowed.Headers.CacheControl?.NoStore).Should().BeTrue();

        authority.Invocations.Should().ContainSingle();
        ledger.Invocations.Should().ContainSingle();
        if (!isRead)
        {
            audit.Verify(a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TechnologyLedgerEntryUpdated && e.RunId == runId),
                It.IsAny<CancellationToken>()), Times.Once);
        }
        shares.Invocations.Should().ContainSingle();
        authority.Invocations.Clear();
        ledger.Invocations.Clear();
        audit.Invocations.Clear();
        shares.Invocations.Clear();
        shareRole = isRead ? null : ArchitectureShareRoles.View;

        using HttpResponseMessage denied = await SendAsync(tenant, workspace, project, authorizedRole);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
        shares.Invocations.Should().ContainSingle();

        if (isRead)
        {
            shareRole = ArchitectureShareRoles.View;
            foreach (var (t, w, p) in new[] { (Guid.NewGuid(), workspace, project),
                         (tenant, Guid.NewGuid(), project), (tenant, workspace, Guid.NewGuid()) })
            {
                using HttpResponseMessage mismatch = await SendAsync(t, w, p, authorizedRole);
                mismatch.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
            shares.Invocations.Should().ContainSingle();
        }

        authority.VerifyNoOtherCalls();
        ledger.VerifyNoOtherCalls();
        audit.Verify(a => a.LogAsync(
            It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TechnologyLedgerEntryUpdated),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
