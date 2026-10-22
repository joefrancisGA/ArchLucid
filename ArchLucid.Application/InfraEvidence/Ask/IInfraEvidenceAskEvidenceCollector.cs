using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.Ask;

public interface IInfraEvidenceAskEvidenceCollector
{
    Task<InfraEvidenceAskEvidenceBundle> CollectAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        string topicKind,
        CancellationToken cancellationToken);
}
