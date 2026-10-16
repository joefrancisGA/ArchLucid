using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>Held-check second pass outcome returned to ingest callers (DX-60).</summary>
public sealed class HeldCheckSecondPassResult
{
    public HeldCheckInputCode InputCode
    {
        get;
        init;
    }

    public HeldCheckSecondPassStatus Status
    {
        get;
        init;
    }

    public Guid? PreviousSnapshotId
    {
        get;
        init;
    }

    public Guid? NewSnapshotId
    {
        get;
        init;
    }

    private IReadOnlyList<string> unblockedEngineTypes = [];

    public IReadOnlyList<string> UnblockedEngineTypes
    {
        get => unblockedEngineTypes;
        init => unblockedEngineTypes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public int NewDecisionGradeCount
    {
        get;
        init;
    }

    public static HeldCheckSecondPassResult NoOp(HeldCheckInputCode inputCode) =>
        new() { InputCode = inputCode, Status = HeldCheckSecondPassStatus.NotEligible };
}
