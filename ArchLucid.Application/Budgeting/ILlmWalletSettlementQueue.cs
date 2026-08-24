namespace ArchLucid.Application.Budgeting;

/// <summary>Post-completion wallet debits and auto-refill triggers (TB-014).</summary>
public interface ILlmWalletSettlementQueue
{
    void EnqueueConsume(Guid tenantId, decimal amountUsd, Guid correlationId, decimal authorizedUsd = 0m);

    void EnqueueAutoRefill(Guid tenantId, Guid correlationId);
}
