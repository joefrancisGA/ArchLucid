using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>First-class waiver / risk exception linked to a finding (TB-059).</summary>
public sealed class RiskExceptionRecord
{
    public Guid RiskExceptionId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public Guid? RunId
    {
        get;
        init;
    }

    public Guid? ManifestId
    {
        get;
        init;
    }

    public string OwnerUserId
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? EvidenceRef
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresAtUtc
    {
        get;
        init;
    }

    private RiskExceptionStatus status = RiskExceptionStatus.Expired;

    [JsonRequired]
    public RiskExceptionStatus Status
    {
        get => status;
        init => status = ContractCollectionDefaults.RequireDefinedEnum(value);
    }

    public DateTimeOffset CreatedAtUtc
    {
        get;
        init;
    }

    public string CreatedByUserId
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset? RevokedAtUtc
    {
        get;
        init;
    }

    public string? RevokedByUserId
    {
        get;
        init;
    }
}
