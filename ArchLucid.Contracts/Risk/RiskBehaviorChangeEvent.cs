namespace ArchLucid.Contracts.Risk;

/// <summary>
/// Logged when a conflict leads to change requirement, an accepted counterfactual, or a subsequent manifest revision.
/// Kept separate from <see cref="RiskOutcomeCaptureEvent" /> — never used to train the model.
/// </summary>
public sealed class RiskBehaviorChangeEvent
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

    /// <summary><c>ChangeRequirement</c>, <c>AcceptCounterfactual</c>, or <c>ManifestRevision</c>.</summary>
    public string ActionTaken
    {
        get;
        set;
    } = null!;
}
