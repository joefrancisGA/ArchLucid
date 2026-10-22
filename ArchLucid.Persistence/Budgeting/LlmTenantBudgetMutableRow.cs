namespace ArchLucid.Persistence.Budgeting;

/// <summary>Mutable budget counters shared by in-memory reserve/settle cores.</summary>
public sealed class LlmTenantBudgetMutableRow
{
    public long TokensConsumed;

    public long ReservedTokens;

    public decimal CommittedUsd;

    public decimal ReservedUsd;

    public decimal PurchasedCapBumpUsd;

    public bool WarnedApproaching;

    public long Version;

    public byte[] RowVersionBytes => BitConverter.GetBytes(Version);
}
