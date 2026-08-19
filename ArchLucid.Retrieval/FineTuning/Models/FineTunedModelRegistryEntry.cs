namespace ArchLucid.Retrieval.FineTuning.Models;

/// <summary>Versioned fine-tuned model registry entry (per tenant).</summary>
public sealed class FineTunedModelRegistryEntry
{
    public Guid RegistryEntryId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid TenantId
    {
        get;
        set;
    }

    public string AzureFineTuningJobId
    {
        get;
        set;
    } = string.Empty;

    public string BaseModelDeploymentName
    {
        get;
        set;
    } = string.Empty;

    public string? FineTunedModelDeploymentName
    {
        get;
        set;
    }

    public FineTuningJobStatus Status
    {
        get;
        set;
    }

    public double? EvalSupportRatio
    {
        get;
        set;
    }

    public bool IsActive
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime? PromotedUtc
    {
        get;
        set;
    }

    public DateTime? RolledBackUtc
    {
        get;
        set;
    }
}
