namespace ArchLucid.Retrieval.FineTuning.Models;

/// <summary>Per-tenant manifest fine-tuning consent (stored in <c>dbo.TenantSettings</c>).</summary>
public enum FineTuningConsentStatus
{
    Disabled = 0,
    Enabled = 1,
    Withdrawn = 2,
}
