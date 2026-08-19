using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Registry;

namespace ArchLucid.Retrieval.FineTuning;

/// <summary>End-to-end manifest fine-tuning orchestration (export → job → eval gate → registry).</summary>
public sealed class OnlineFineTuningOrchestrationService(
    IAcceptedManifestTrainingDataExporter exporter,
    IFineTuningJobOrchestrator jobOrchestrator,
    IFineTuningPromotionGate promotionGate,
    IFineTunedModelRegistry registry)
{
    private readonly IAcceptedManifestTrainingDataExporter _exporter =
        exporter ?? throw new ArgumentNullException(nameof(exporter));

    private readonly IFineTuningJobOrchestrator _jobOrchestrator =
        jobOrchestrator ?? throw new ArgumentNullException(nameof(jobOrchestrator));

    private readonly IFineTuningPromotionGate _promotionGate =
        promotionGate ?? throw new ArgumentNullException(nameof(promotionGate));

    private readonly IFineTunedModelRegistry _registry =
        registry ?? throw new ArgumentNullException(nameof(registry));

    /// <summary>Exports training data, optionally submits a job, and evaluates promotion when ratios are supplied.</summary>
    public async Task<(FineTuningTrainingExportResult Export, FineTunedModelRegistryEntry? Job, FineTuningEvalGateResult? Eval)> RunPipelineAsync(
        ScopeContext scope,
        IReadOnlyList<ManifestDocument> manifests,
        double? baseSupportRatio,
        double? fineTunedSupportRatio,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(manifests);

        FineTuningTrainingExportResult export = await _exporter
            .ExportAsync(scope, manifests, cancellationToken)
            .ConfigureAwait(false);

        FineTunedModelRegistryEntry? job = null;
        FineTuningEvalGateResult? eval = null;

        if (_jobOrchestrator.IsConfigured && export.Records.Count > 0)
        {
            string jsonl = AzureOpenAiFineTuningJobOrchestrator.SerializeTrainingJsonl(export.Records);

            job = await _jobOrchestrator
                .SubmitJobAsync(scope.TenantId, jsonl, string.Empty, cancellationToken)
                .ConfigureAwait(false);

            if (baseSupportRatio is not null && fineTunedSupportRatio is not null)
            {
                eval = _promotionGate.Evaluate(baseSupportRatio.Value, fineTunedSupportRatio.Value);

                if (eval.Promoted)
                {
                    job.EvalSupportRatio = fineTunedSupportRatio;
                    job.IsActive = true;
                    job.PromotedUtc = TimeProvider.System.UtcNowDateTime();
                    job.Status = FineTuningJobStatus.Succeeded;
                    await _registry.SaveAsync(job, cancellationToken).ConfigureAwait(false);
                }
                else
                {
                    await _registry.RollbackActiveAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
                    job.Status = FineTuningJobStatus.Failed;
                }
            }
        }

        return (export, job, eval);
    }
}
