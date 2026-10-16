using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Operator;

/// <summary>Response for <c>GET /v1/operator/saved-views</c>.</summary>
public sealed class OperatorSavedViewListResponse
{
    private IReadOnlyList<OperatorSavedViewResponse> views = [];

    public IReadOnlyList<OperatorSavedViewResponse> Views
    {
        get => views;
        set => views = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
