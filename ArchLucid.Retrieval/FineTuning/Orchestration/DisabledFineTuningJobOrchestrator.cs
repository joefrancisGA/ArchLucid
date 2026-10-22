using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Orchestration;

/// <summary>Fail-closed orchestrator when fine-tuning is disabled or Azure OpenAI is not configured.</summary>
public sealed class DisabledFineTuningJobOrchestrator : IFineTuningJobOrchestrator
{
    /// <inheritdoc />
    public bool IsConfigured => false;

    /// <inheritdoc />
    public Task<FineTunedModelRegistryEntry> SubmitJobAsync(
        Guid tenantId,
        string trainingJsonl,
        string baseModelDeploymentName,
        CancellationToken cancellationToken)
    {
        throw new InvalidOperationException(
            "Manifest fine-tuning job orchestration is disabled. Set Retrieval:FineTuning:Enabled and configure Azure OpenAI.");
    }
}
