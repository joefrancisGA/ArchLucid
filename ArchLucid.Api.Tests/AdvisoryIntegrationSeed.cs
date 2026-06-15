using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.DependencyInjection;

using AuthorityGoldenManifestRepository = ArchLucid.Core.Manifest.IGoldenManifestRepository;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared authority run graph for advisory HTTP integration tests (<see cref="AlertLifecycleIntegrationTests" />,
///     digest delivery lifecycle, Ask thread tests). Seeds the full Runs → snapshot chain → golden manifest order required
///     when <c>ArchLucid:StorageProvider=Sql</c> (migration 212 trusted FK constraints).
/// </summary>
public static class AdvisoryIntegrationSeed
{
    /// <summary>
    ///     Inserts one authority run + golden manifest for <see cref="ScopeIds" /> defaults and project slug <c>default</c>.
    /// </summary>
    /// <returns>The seeded run id (useful for Ask tests that need a run anchor).</returns>
    public static async Task<Guid> SeedDefaultScopeAuthorityRunAsync(IServiceProvider services, CancellationToken ct)
    {
        using IServiceScope scope = services.CreateScope();
        IServiceProvider serviceProvider = scope.ServiceProvider;
        AuthorityGoldenManifestRepository goldenRepo =
            serviceProvider.GetRequiredService<AuthorityGoldenManifestRepository>();
        IRunRepository runRepo = serviceProvider.GetRequiredService<IRunRepository>();
        IContextSnapshotRepository contextSnapshotRepo =
            serviceProvider.GetRequiredService<IContextSnapshotRepository>();
        IGraphSnapshotRepository graphSnapshotRepo =
            serviceProvider.GetRequiredService<IGraphSnapshotRepository>();
        IFindingsSnapshotRepository findingsSnapshotRepo =
            serviceProvider.GetRequiredService<IFindingsSnapshotRepository>();
        IDecisionTraceRepository decisionTraceRepo =
            serviceProvider.GetRequiredService<IDecisionTraceRepository>();

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        Guid graphSnapshotId = Guid.NewGuid();
        Guid findingsSnapshotId = Guid.NewGuid();
        Guid decisionTraceId = Guid.NewGuid();
        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
        string projectSlug = AdvisoryScanSchedule.DefaultProjectSlug;

        RunRecord run = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ScopeProjectId = ScopeIds.DefaultProject,
            RunId = runId,
            ProjectId = projectSlug,
            CreatedUtc = createdUtc,
            GoldenManifestId = manifestId
        };

        // Authority chain FK order: Runs → ContextSnapshots → GraphSnapshots → FindingsSnapshots → DecisioningTraces → GoldenManifests.
        await runRepo.SaveAsync(run, ct);

        await contextSnapshotRepo.SaveAsync(
            new ContextSnapshot
            {
                SnapshotId = contextSnapshotId,
                RunId = runId,
                ProjectId = projectSlug,
                CreatedUtc = createdUtc
            },
            ct);

        await graphSnapshotRepo.SaveAsync(
            new GraphSnapshot
            {
                GraphSnapshotId = graphSnapshotId,
                ContextSnapshotId = contextSnapshotId,
                RunId = runId,
                CreatedUtc = createdUtc
            },
            ct);

        await findingsSnapshotRepo.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = findingsSnapshotId,
                RunId = runId,
                ContextSnapshotId = contextSnapshotId,
                GraphSnapshotId = graphSnapshotId,
                CreatedUtc = createdUtc
            },
            ct);

        await decisionTraceRepo.SaveAsync(
            RuleAuditTraceDto.From(
                new RuleAuditTracePayload
                {
                    TenantId = ScopeIds.DefaultTenant,
                    WorkspaceId = ScopeIds.DefaultWorkspace,
                    ProjectId = ScopeIds.DefaultProject,
                    DecisionTraceId = decisionTraceId,
                    RunId = runId,
                    CreatedUtc = createdUtc,
                    RuleSetId = "test-rs",
                    RuleSetVersion = "1",
                    RuleSetHash = "test-rh",
                    ContextSnapshotId = contextSnapshotId,
                    GraphSnapshotId = graphSnapshotId,
                    FindingsSnapshotId = findingsSnapshotId
                }),
            ct);

        ManifestDocument manifest = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshotId,
            FindingsSnapshotId = findingsSnapshotId,
            DecisionTraceId = decisionTraceId,
            CreatedUtc = createdUtc,
            ManifestHash = "integration-seed",
            RuleSetId = "test-rs",
            RuleSetVersion = "1",
            RuleSetHash = "test-rh"
        };

        await goldenRepo.SaveAsync(manifest, ct);

        return runId;
    }
}
