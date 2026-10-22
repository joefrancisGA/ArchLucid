using ArchLucid.Core.Budgeting;

namespace ArchLucid.Persistence.Budgeting;

/// <summary>
///     Shared reserve logic for in-memory and SQL LLM tenant budget repositories.
/// </summary>
public static class LlmTenantBudgetReserveCore
{
    public static LlmTenantBudgetReserveResult TryReserveDaily(
        LlmTenantBudgetMutableRow row,
        LlmTenantBudgetReserveRequest request,
        Func<LlmTenantBudgetMutableRow, LlmTenantBudgetStateReadModel> toModel)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(toModel);

        if (request.ReserveTokens < 1)
            return new LlmTenantBudgetReserveResult { NewState = toModel(row) };

        if (request.HardCapTokens is null)
            throw new ArgumentException("HardCapTokens is required for daily reserve.", nameof(request));

        if (LlmTenantBudgetPeriodCore.IsDailyHardCapBlocked(
                row.TokensConsumed,
                row.ReservedTokens,
                request.ReserveTokens,
                request.HardCapTokens.Value))
        {
            return new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = toModel(row) };
        }

        row.ReservedTokens += request.ReserveTokens;
        row.Version++;

        return new LlmTenantBudgetReserveResult { NewState = toModel(row) };
    }

    public static LlmTenantBudgetReserveResult TryReserveMonthly(
        LlmTenantBudgetMutableRow row,
        LlmTenantBudgetReserveRequest request,
        Func<LlmTenantBudgetMutableRow, LlmTenantBudgetStateReadModel> toModel)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(toModel);

        if (request.ReserveUsd <= 0m)
            return new LlmTenantBudgetReserveResult { NewState = toModel(row) };

        if (request.HardCapUsd is null)
            throw new ArgumentException("HardCapUsd is required for monthly reserve.", nameof(request));

        if (LlmTenantBudgetPeriodCore.IsMonthlyHardCapBlocked(
                row.CommittedUsd,
                row.ReservedUsd,
                request.ReserveUsd,
                request.HardCapUsd.Value))
        {
            return new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = toModel(row) };
        }

        row.ReservedUsd += request.ReserveUsd;
        row.Version++;

        return new LlmTenantBudgetReserveResult { NewState = toModel(row) };
    }
}
