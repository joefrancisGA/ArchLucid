namespace ArchLucid.Contracts.Operator;

/// <summary>Response for <c>GET /v1/operator/saved-views</c>.</summary>
public sealed class OperatorSavedViewListResponse
{
    public IReadOnlyList<OperatorSavedViewResponse> Views
    {
        get;
        set;
    } = [];
}
