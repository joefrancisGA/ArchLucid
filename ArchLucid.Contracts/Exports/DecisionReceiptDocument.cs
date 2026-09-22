using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Exports;

/// <summary>Exportable JSON artifact for a reasoned no or admission redirect (ADR 0052).</summary>
public sealed class DecisionReceiptDocument
{
    public string SchemaVersion
    {
        get;
        set;
    } = DecisionReceiptConstants.SchemaVersion;

    public DateTime GeneratedUtc
    {
        get;
        set;
    }

    public DecisionReceiptSource Source
    {
        get;
        set;
    }

    public Guid? DraftId
    {
        get;
        set;
    }

    public Guid? RunId
    {
        get;
        set;
    }

    public string? RedirectReason
    {
        get;
        set;
    }

    public DecisionReceiptIntakeContext? Intake
    {
        get;
        set;
    }

    public FeasibilityVerdict Verdict
    {
        get;
        set;
    } = new();

    /// <summary>Wave-13 suggestion 123: SHA-256 over canonical committed manifest hash at receipt time.</summary>
    public string? ManifestHashSha256
    {
        get;
        set;
    }

    /// <summary>Committed golden manifest contract version bound into the receipt.</summary>
    public string? ManifestVersion
    {
        get;
        set;
    }

    /// <summary>Wave-15 suggestion 150: canonical SHA-256 over exportable receipt fields.</summary>
    public string? ReceiptHashSha256
    {
        get;
        set;
    }

    public DecisionReceiptCostStory CostStory
    {
        get;
        set;
    } = new();

    /// <summary>CG-025 — structural execute Mode stamped on committed-run receipts (not part of sealed receipt hash).</summary>
    public StructuralExecutionMode? StructuralExecutionMode
    {
        get;
        set;
    }

    /// <summary>CG-025 — Working Career vs Rehearsal door stamp (<see cref="User.WorkingCareerRehearsalDoorValues" />).</summary>
    public string? WorkingCareerRehearsalDoor
    {
        get;
        set;
    }

    /// <summary>CG-025 — true when Simulator/Fallback rehearsal exports are not career-complete.</summary>
    public bool RehearsalIncomplete
    {
        get;
        set;
    }
}
