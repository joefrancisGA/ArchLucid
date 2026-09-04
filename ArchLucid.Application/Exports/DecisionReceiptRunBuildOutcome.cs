namespace ArchLucid.Application.Exports;

/// <summary>Outcome of building a committed-run decision receipt for export.</summary>
public enum DecisionReceiptRunBuildOutcome
{
    Success,
    NotFound,
    SealedReceiptIncomplete,
    SealedHashMismatch,
}
