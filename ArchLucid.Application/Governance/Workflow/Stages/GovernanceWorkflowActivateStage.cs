using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Transactions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <inheritdoc cref="IGovernanceWorkflowActivateStage" />
public sealed class GovernanceWorkflowActivateStage(
    IGovernanceEnvironmentActivationRepository activationRepo,
    IRunDetailQueryService runDetailQueryService,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IBaselineMutationAuditService baselineMutationAudit,
    GovernanceWorkflowAuditSupport auditSupport,
    GovernanceWorkflowIntegrationEventSupport integrationEvents,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<GovernanceWorkflowActivateStage> logger) : IGovernanceWorkflowActivateStage
{
    private readonly IGovernanceEnvironmentActivationRepository _activationRepo =
        activationRepo ?? throw new ArgumentNullException(nameof(activationRepo));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly GovernanceWorkflowAuditSupport _auditSupport =
        auditSupport ?? throw new ArgumentNullException(nameof(auditSupport));

    private readonly GovernanceWorkflowIntegrationEventSupport _integrationEvents =
        integrationEvents ?? throw new ArgumentNullException(nameof(integrationEvents));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<GovernanceWorkflowActivateStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(manifestVersion);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(activatedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(environment);
        ArgumentException.ThrowIfNullOrWhiteSpace(activatedBy);

        manifestVersion = manifestVersion.Trim();

        ArchitectureRunDetail runDetail = await _runDetailQueryService.GetRunDetailAsync(runId, cancellationToken)
            ?? throw new RunNotFoundException(runId);

        GoldenManifest? manifest =
            runDetail.Manifest is not null
            && string.Equals(runDetail.Run.CurrentManifestVersion, manifestVersion, StringComparison.Ordinal)
                ? runDetail.Manifest
                : await _unifiedGoldenManifestReader.GetByVersionAsync(manifestVersion, cancellationToken)
                    .ConfigureAwait(false);

        if (manifest is null)
            throw new GoldenManifestVersionNotFoundException(manifestVersion, runId);

        if (!string.Equals(manifest.RunId, runId, StringComparison.Ordinal))
            throw new GoldenManifestVersionNotFoundException(manifestVersion, runId);

        IReadOnlyList<GovernanceEnvironmentActivation> existing = await _activationRepo.GetByEnvironmentAsync(environment, cancellationToken);

        GovernanceEnvironmentActivation activation = new()
        {
            RunId = runDetail.Run.RunId,
            ManifestVersion = manifestVersion,
            Environment = environment,
            IsActive = true,
            ActivatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        _auditSupport.StampGovernanceScope(activation);

        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);
        IntegrationEventsOptions integrationOpts = _integrationEventsOptions.CurrentValue;
        bool enqueuePromotionInSqlTx = integrationOpts.TransactionalOutboxEnabled && uow.SupportsExternalTransaction;

        try
        {
            if (uow.SupportsExternalTransaction)
            {
                foreach (GovernanceEnvironmentActivation active in existing.Where(a => a.IsActive))
                {
                    active.IsActive = false;
                    await _activationRepo.UpdateAsync(active, cancellationToken, uow.Connection, uow.Transaction);
                }

                await _activationRepo.CreateAsync(activation, cancellationToken, uow.Connection, uow.Transaction);

                if (enqueuePromotionInSqlTx)
                {
                    await _integrationEvents.TryPublishPromotionActivatedAsync(
                        activation,
                        activatedBy,
                        uow.Connection,
                        uow.Transaction,
                        cancellationToken);
                }
            }
            else
            {
                foreach (GovernanceEnvironmentActivation active in existing.Where(a => a.IsActive))
                {
                    active.IsActive = false;
                    await _activationRepo.UpdateAsync(active, cancellationToken);
                }

                await _activationRepo.CreateAsync(activation, cancellationToken);
            }

            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }

        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Governance.EnvironmentActivated,
            activatedBy,
            activation.ActivationId,
            $"RunId={activation.RunId}; ManifestVersion={manifestVersion}; Environment={environment}",
            cancellationToken);

        Guid? activationRunId = Guid.TryParse(activation.RunId, out Guid activationRunGuid) ? activationRunGuid : null;
        AuditEvent governanceActivated = _auditSupport.CreateGovernanceEnvironmentActivatedAuditEvent(activation, activatedBy);
        governanceActivated.RunId = activationRunId;
        await _auditSupport.LogGovernanceDurableWithRetryAsync(
            governanceActivated,
            $"GovernanceEnvironmentActivated:{LogSanitizer.Sanitize(activation.ActivationId)}",
            cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformationGovernanceEnvironmentActivated(activation.ActivationId, activation.RunId, activation.ManifestVersion, activation.Environment);

        if (!enqueuePromotionInSqlTx)
        {
            await _integrationEvents.TryPublishPromotionActivatedAsync(
                activation,
                activatedBy,
                null,
                null,
                cancellationToken);
        }

        return activation;
    }
}
