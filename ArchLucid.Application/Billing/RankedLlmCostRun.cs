using ArchLucid.Contracts.Billing;

namespace ArchLucid.Application.Billing;

/// <summary>
///     One dashboard candidate. Unpriced runs all report zero USD, so ranking uses every measurable token,
///     including reasoning tokens that are not on <see cref="LlmCostTopRunRowResponse"/>.
/// </summary>
internal sealed class RankedLlmCostRun(LlmCostTopRunRowResponse row, long measurableTokens)
{
    public LlmCostTopRunRowResponse Row { get; } = row ?? throw new ArgumentNullException(nameof(row));

    public long MeasurableTokens { get; } = measurableTokens;
}
