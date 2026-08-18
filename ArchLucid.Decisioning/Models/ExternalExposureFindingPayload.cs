namespace ArchLucid.Decisioning.Models;

public sealed class ExternalExposureFindingPayload
{
    public string ActorNodeId
    {
        get;
        set;
    } = string.Empty;

    public string ActorLabel
    {
        get;
        set;
    } = string.Empty;

    public string TrustOrigin
    {
        get;
        set;
    } = string.Empty;
}
