using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>Validates TB-059 waiver requests before persistence.</summary>
public static class RiskExceptionValidation
{
    public const int DefaultDurationDays = 90;

    public const int MaxDurationDays = 365;

    public static void Validate(CreateRiskExceptionRequest request, DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FindingId))
            throw new ArgumentException("Finding id is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.OwnerUserId))
            throw new ArgumentException("Owner user id is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.Rationale))
            throw new ArgumentException("Rationale is required.", nameof(request));

        if (request.ExpiresAtUtc <= nowUtc)
            throw new ArgumentException("Expiration must be in the future.", nameof(request));

        DateTimeOffset maxExpiry = nowUtc.AddDays(MaxDurationDays);

        if (request.ExpiresAtUtc > maxExpiry)
            throw new ArgumentException($"Waiver duration cannot exceed {MaxDurationDays} days.", nameof(request));
    }

    public static DateTimeOffset DefaultExpiresAtUtc(DateTimeOffset nowUtc) =>
        nowUtc.AddDays(DefaultDurationDays);
}
