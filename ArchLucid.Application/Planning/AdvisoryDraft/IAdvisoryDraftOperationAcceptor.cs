using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public interface IAdvisoryDraftOperationAcceptor
{
    Task<string> AcceptAsync(
        DraftArchitectureRequestInput input,
        ScopeContext scope,
        CancellationToken cancellationToken);
}
