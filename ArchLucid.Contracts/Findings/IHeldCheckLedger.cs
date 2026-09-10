namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Collects missing-input attribution when engines fail closed (DX-52).
///     Null on golden harness contexts so distribution stays unchanged.
/// </summary>
public interface IHeldCheckLedger
{
    void Record(string engineType, HeldCheckInputCode inputCode);

    IReadOnlyList<HeldCheckLedgerRollupEntry> BuildRollup();
}
