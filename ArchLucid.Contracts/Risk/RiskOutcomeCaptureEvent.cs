namespace ArchLucid.Contracts.Risk;

/// <summary>
/// Predictive-validity signal captured on ignored findings. Case B (ignored-but-came-true) calibrates the flywheel.
/// Never conflated with <see cref="RiskBehaviorChangeEvent" />.
/// </summary>
public sealed class RiskOutcomeCaptureEvent
{
    public string EventId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string SnapshotId
    {
        get;
        set;
    } = null!;

    public string ItemId
    {
        get;
        set;
    } = null!;

    public string TenantId
    {
        get;
        set;
    } = null!;

    public DateTimeOffset OccurredAt
    {
        get;
        set;
    }

    /// <summary><c>ConfirmedCorrect</c>, <c>ConfirmedIncorrect</c>, or <c>Inconclusive</c>.</summary>
    public string OutcomeVerdict
    {
        get;
        set;
    } = null!;

    public string? Notes
    {
        get;
        set;
    }
}
