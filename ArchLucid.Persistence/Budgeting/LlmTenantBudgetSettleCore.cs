using ArchLucid.Core.Budgeting;

namespace ArchLucid.Persistence.Budgeting;

/// <summary>
///     Shared settle and warn-audit logic for in-memory and SQL LLM tenant budget repositories.
/// </summary>
public static class LlmTenantBudgetSettleCore
{
    public static LlmTenantBudgetSettleResult TrySettleDaily(
        LlmTenantBudgetMutableRow row,
        LlmTenantBudgetSettleRequest request,
        Func<LlmTenantBudgetMutableRow, LlmTenantBudgetStateReadModel> toModel)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(toModel);

        if (request.ReleaseReservedTokens > row.ReservedTokens)
            return new LlmTenantBudgetSettleResult { ConcurrencyConflict = true };

        if (request is { ActualTokens: 0, ReleaseReservedTokens: 0 })
            return new LlmTenantBudgetSettleResult { NewState = toModel(row) };

        long oldTotal = row.TokensConsumed;
        bool oldWarned = row.WarnedApproaching;

        row.TokensConsumed += request.ActualTokens;
        row.ReservedTokens -= request.ReleaseReservedTokens;

        if (!row.WarnedApproaching
            && LlmTenantBudgetPeriodCore.ShouldEmitTokenWarnAudit(
                oldTotal,
                row.TokensConsumed,
                request.WarnAtTokens,
                row.WarnedApproaching))
        {
            row.WarnedApproaching = true;
        }

        row.Version++;

        bool shouldAudit = LlmTenantBudgetPeriodCore.ShouldEmitTokenWarnAudit(
            oldTotal,
            row.TokensConsumed,
            request.WarnAtTokens,
            oldWarned);

        return new LlmTenantBudgetSettleResult { NewState = toModel(row), ShouldEmitWarnAudit = shouldAudit };
    }

    public static LlmTenantBudgetSettleResult TrySettleMonthly(
        LlmTenantBudgetMutableRow row,
        LlmTenantBudgetSettleRequest request,
        Func<LlmTenantBudgetMutableRow, LlmTenantBudgetStateReadModel> toModel)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(toModel);

        if (request.ReleaseReservedUsd > row.ReservedUsd)
            return new LlmTenantBudgetSettleResult { ConcurrencyConflict = true };

        if (request is { ActualUsd: 0m, ReleaseReservedUsd: 0m })
            return new LlmTenantBudgetSettleResult { NewState = toModel(row) };

        decimal oldSpent = row.CommittedUsd;
        bool oldWarned = row.WarnedApproaching;

        row.CommittedUsd += request.ActualUsd;
        row.ReservedUsd -= request.ReleaseReservedUsd;

        if (!row.WarnedApproaching
            && LlmTenantBudgetPeriodCore.ShouldEmitUsdWarnAudit(
                oldSpent,
                row.CommittedUsd,
                request.WarnAtUsd,
                row.WarnedApproaching))
        {
            row.WarnedApproaching = true;
        }

        row.Version++;

        bool shouldAudit = LlmTenantBudgetPeriodCore.ShouldEmitUsdWarnAudit(
            oldSpent,
            row.CommittedUsd,
            request.WarnAtUsd,
            oldWarned);

        return new LlmTenantBudgetSettleResult { NewState = toModel(row), ShouldEmitWarnAudit = shouldAudit };
    }
}
