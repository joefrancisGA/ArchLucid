using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Orchestration;

/// <summary>Submits Azure OpenAI fine-tuning jobs from exported training bundles.</summary>
public interface IFineTuningJobOrchestrator
{
    bool IsConfigured
    {
        get;
    }

    Task<FineTunedModelRegistryEntry> SubmitJobAsync(
        Guid tenantId,
        string trainingJsonl,
        string baseModelDeploymentName,
        CancellationToken cancellationToken);
}
