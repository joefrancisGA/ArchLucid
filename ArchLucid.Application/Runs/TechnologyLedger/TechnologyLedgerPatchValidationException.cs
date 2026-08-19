namespace ArchLucid.Application.Runs.TechnologyLedger;

/// <summary>
///     Thrown when a Technology Ledger PATCH violates v1 invariants. Maps to HTTP 400.
/// </summary>
public sealed class TechnologyLedgerPatchValidationException(string message) : Exception(message);
