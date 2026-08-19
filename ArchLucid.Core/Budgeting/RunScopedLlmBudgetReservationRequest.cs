namespace ArchLucid.Core.Budgeting;

public sealed class RunScopedLlmBudgetReservationRequest
{
    public required Guid ReservationId { get; init; }
    public required Guid TenantId { get; init; }
    public required string RunId { get; init; }
    public required string IdempotencyKey { get; init; }
    public required string PeriodKey { get; init; }
    public required DateTimeOffset UtcNow { get; init; }
    public required decimal ReserveUsd { get; init; }
    /// <summary>Current tenant monthly USD pressure (spent + per-call reserved) from budget repository.</summary>
    public required decimal CurrentPressureUsd { get; init; }
    public required decimal HardCapUsd { get; init; }
    public required decimal AccountingGracePercent { get; init; }
    public required TimeSpan ReservationTtl { get; init; }
}
