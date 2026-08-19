namespace ArchLucid.Contracts.Operator;

/// <summary>Request body for <c>POST /v1/operator/saved-views</c>.</summary>
public sealed class CreateOperatorSavedViewRequest
{
    public string Surface
    {
        get;
        set;
    } = string.Empty;

    public string Name
    {
        get;
        set;
    } = string.Empty;

    public OperatorSavedViewPayload Payload
    {
        get;
        set;
    } = new();

    /// <summary>When true, the view is visible to all users in the tenant for the same surface.</summary>
    public bool IsShared
    {
        get;
        set;
    }
}
