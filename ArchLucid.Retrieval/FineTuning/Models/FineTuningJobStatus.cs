namespace ArchLucid.Retrieval.FineTuning.Models;

/// <summary>Azure OpenAI fine-tuning job lifecycle states.</summary>
public enum FineTuningJobStatus
{
    NotConfigured = 0,
    Pending = 1,
    Running = 2,
    Succeeded = 3,
    Failed = 4,
    Cancelled = 5,
}
