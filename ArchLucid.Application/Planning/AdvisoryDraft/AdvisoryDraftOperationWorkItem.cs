using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class AdvisoryDraftOperationWorkItem
{
    public required string OperationId
    {
        get;
        init;
    }

    public required ScopeContext Scope
    {
        get;
        init;
    }

    public required DraftArchitectureRequestInput Input
    {
        get;
        init;
    }
}
