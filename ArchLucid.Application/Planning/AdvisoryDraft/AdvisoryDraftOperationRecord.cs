using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class AdvisoryDraftOperationRecord
{
    public required Guid OperationId
    {
        get;
        init;
    }

    public required ScopeContext Scope
    {
        get;
        init;
    }

    public OperationState State
    {
        get;
        set;
    }

    public string StepLabel
    {
        get;
        set;
    } = AdvisoryDraftOperationSteps.Queued;

    public int CurrentStep
    {
        get;
        set;
    }

    public int TotalSteps { get; } = AdvisoryDraftOperationSteps.TotalSteps;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset HeartbeatUtc
    {
        get;
        set;
    }

    public DateTimeOffset? CompletedUtc
    {
        get;
        set;
    }

    public DraftArchitectureRequestResponse? Result
    {
        get;
        set;
    }

    public string? ErrorMessage
    {
        get;
        set;
    }
}
