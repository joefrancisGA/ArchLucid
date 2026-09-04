using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditFrameworkRecord
{
    public Guid FrameworkId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string Version
    {
        get;
        init;
    } = string.Empty;

    public string? Publisher
    {
        get;
        init;
    }

    public DateOnly? EffectiveDate
    {
        get;
        init;
    }

    public string SourceReference
    {
        get;
        init;
    } = string.Empty;

    public AuditFrameworkStatus Status
    {
        get;
        init;
    }

    public byte[] ContentHashSha256
    {
        get;
        init;
    } = [];

    public byte[] SpecBlob
    {
        get;
        init;
    } = [];

    public string? ImportedBy
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
