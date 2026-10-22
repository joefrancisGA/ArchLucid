using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityEvidencePathReportUnevaluatedGroupResponse
{
    public string ReasonCode
    {
        get;
        init;
    } = string.Empty;

    public string WhyText
    {
        get;
        init;
    } = string.Empty;

    public int? PathCount
    {
        get;
        init;
    }

    private IReadOnlyList<Guid> pathIds = [];

    public IReadOnlyList<Guid> PathIds
    {
        get => pathIds;
        init => pathIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string? EngineName
    {
        get;
        init;
    }

    public int? LimitValue
    {
        get;
        init;
    }

    public int? PathsEmitted
    {
        get;
        init;
    }
}
