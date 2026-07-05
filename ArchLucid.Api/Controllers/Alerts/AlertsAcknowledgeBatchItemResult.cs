namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>Per-alert outcome for batch acknowledge.</summary>
public sealed class AlertsAcknowledgeBatchItemResult
{
    public Guid AlertId
    {
        get;
        set;
    }

    public bool Succeeded
    {
        get;
        set;
    }

    public string? Message
    {
        get;
        set;
    }
}
