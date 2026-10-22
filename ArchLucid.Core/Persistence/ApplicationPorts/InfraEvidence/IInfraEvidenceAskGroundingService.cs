using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IInfraEvidenceAskGroundingService
{
    Task<InfraEvidenceAskGroundingResult> TryAnswerAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class InfraEvidenceAskGroundingResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public InfraEvidenceAskResponse? Response
    {
        get;
        init;
    }
}
