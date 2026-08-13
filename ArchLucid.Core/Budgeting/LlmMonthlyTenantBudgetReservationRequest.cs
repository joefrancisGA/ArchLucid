namespace ArchLucid.Core.Budgeting;

/// <summary>Pre-call monthly USD reservation lease mint request (TB-976).</summary>
public sealed class LlmMonthlyTenantBudgetReservationRequest
{
    public Guid ReservationId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string PeriodKey
    {
        get;
        init;
    } = "";

    public decimal ReserveUsd
    {
        get;
        init;
    }

    public decimal HardCapUsd
    {
        get;
        init;
    }

    public byte[] ExpectedRowVersion
    {
        get;
        init;
    } = [];

    public DateTimeOffset UtcNow
    {
        get;
        init;
    }

    public TimeSpan ReservationTtl
    {
        get;
        init;
    }
}
