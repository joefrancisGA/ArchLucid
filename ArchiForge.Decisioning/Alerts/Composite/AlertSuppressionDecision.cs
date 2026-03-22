namespace ArchiForge.Decisioning.Alerts.Composite;

public class AlertSuppressionDecision
{
    public bool ShouldCreateAlert { get; set; }
    public bool WasSuppressed { get; set; }
    public bool WasReopened { get; set; }

    public string Reason { get; set; } = default!;
    public string DeduplicationKey { get; set; } = default!;
}
