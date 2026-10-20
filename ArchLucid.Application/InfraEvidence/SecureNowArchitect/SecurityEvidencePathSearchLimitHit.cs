using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed class SecurityEvidencePathSearchLimitHit
{
    public SecurityEvidencePathSearchLimitKind Kind
    {
        get;
        init;
    }

    public int LimitValue
    {
        get;
        init;
    }

    public int PathsEmitted
    {
        get;
        init;
    }
}
