using System.Text.Json;

using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Manifest;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <inheritdoc cref="IAuthorityPipelineArtifactsStage" />
public sealed class AuthorityPipelineArtifactsStage(
    ITechnologyLedgerRepository technologyLedgerRepository,
    IArtifactSynthesisService artifactSynthesisService,
    IAuthorityPipelineStagePersistence stagePersistence,
    IAuditService auditService,
    ILogger<AuthorityPipelineArtifactsStage> logger,
    IArchitectureIdentityRepository? architectureIdentityRepository = null) : IAuthorityPipelineArtifactsStage
{
    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly IArtifactSynthesisService _artifactSynthesisService =
        artifactSynthesisService ?? throw new ArgumentNullException(nameof(artifactSynthesisService));

    private readonly IAuthorityPipelineStagePersistence _stagePersistence =
        stagePersistence ?? throw new ArgumentNullException(nameof(stagePersistence));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<AuthorityPipelineArtifactsStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IArchitectureIdentityRepository? _architectureIdentityRepository =
        architectureIdentityRepository;

    /// <inheritdoc />
    public async Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        RunRecord run = context.Run;
        ScopeContext scope = context.Scope;

        ArtifactBundle artifactBundle;
        try
        {
            IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
                await _technologyLedgerRepository.GetByRunIdAsync(scope, run.RunId.ToString("D"), cancellationToken);

            artifactBundle = await _artifactSynthesisService.SynthesizeAsync(
                context.Manifest!,
                ledgerEntries,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArtifactSynthesisFailed,
                    RunId = run.RunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    ManifestId = context.Manifest!.ManifestId,
                    DataJson = JsonSerializer.Serialize(
                        new { reason = ex.GetType().Name },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);

            throw;
        }

        if (artifactBundle.Status == ArtifactBundleStatus.Partial)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArtifactSynthesisPartial,
                    RunId = run.RunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    ManifestId = context.Manifest!.ManifestId,
                    DataJson = JsonSerializer.Serialize(
                        new { artifactBundle.BundleId, artifactBundle.Trace.TraceId },
                        AuditJsonSerializationOptions.Instance),
                },
                context.UnitOfWork,
                cancellationToken);
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Authority pipeline artifacts synthesized: RunId={RunId}, BundleId={BundleId}, ArtifactCount={ArtifactCount}, SynthesisTraceId={SynthesisTraceId}",
                run.RunId,
                artifactBundle.BundleId,
                artifactBundle.Artifacts.Count,
                artifactBundle.Trace.TraceId);
        }

        await _stagePersistence.SaveArtifactBundleAsync(artifactBundle, context.UnitOfWork, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArtifactsGenerated,
                RunId = run.RunId,
                ManifestId = context.Manifest!.ManifestId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        artifactBundle.BundleId,
                        ArtifactCount = artifactBundle.Artifacts.Count
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            context.UnitOfWork,
            cancellationToken);

        context.ArtifactBundle = artifactBundle;

        if (context.Trace is not RuleAuditTraceDto ruleAuditTrace)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        run.DecisionTraceId = ruleAuditTrace.RuleAudit.DecisionTraceId;
        run.GoldenManifestId = context.Manifest!.ManifestId;
        run.ArtifactBundleId = artifactBundle.BundleId;
        run.CurrentManifestVersion = AuthorityCommitManifestVersionRules.ResolveContractManifestVersion(context.Manifest!);
        await _stagePersistence.UpdateRunAsync(run, context.UnitOfWork, cancellationToken);
        await TryUpdateArchitectureLatestSealedManifestAsync(run, context.Manifest!.ManifestId, scope, cancellationToken);
    }

    private async Task TryUpdateArchitectureLatestSealedManifestAsync(
        RunRecord run,
        Guid manifestId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (_architectureIdentityRepository is null || !run.ArchitectureId.HasValue)
            return;

        try
        {
            await _architectureIdentityRepository
                .UpdateLatestSealedManifestAsync(scope, run.ArchitectureId.Value, manifestId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Failed to update LatestSealedManifestId for ArchitectureId={ArchitectureId}.",
                    run.ArchitectureId);
            }
        }
    }
}
