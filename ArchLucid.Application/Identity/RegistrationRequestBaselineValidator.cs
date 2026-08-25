using System.Text;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Validates optional structured-baseline fields on public self-service registration.
/// </summary>
public static class RegistrationRequestBaselineValidator
{
    public static readonly string[] AllowedCompanySizes =
    [
        "1-10", "11-50", "51-200", "201-1000", "1001-5000", "5001-50000", "50001+"
    ];

    public static readonly string[] IndustryVerticals =
    [
        "Healthcare",
        "Financial Services",
        "Technology",
        "Government / Public Sector",
        "Manufacturing",
        "Retail",
        "Insurance",
        "Energy / Utilities",
        "Education",
        "Telecommunications",
        "Other"
    ];

    public static RegistrationBaselineValidation Validate(TenantSelfRegistrationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string? normalizedSource = NormalizeBaselineReviewCycleSource(request.BaselineReviewCycleSource);

        if (request.BaselineReviewCycleHours is null && normalizedSource is not null)
        {
            return RegistrationBaselineValidation.Fail(
                "BaselineReviewCycleHours is required when BaselineReviewCycleSource is provided.",
                "baseline_incomplete",
                "BaselineReviewCycleHours is required when BaselineReviewCycleSource is provided.");
        }

        if (request.BaselineReviewCycleHours is <= 0m or > 10_000m)
        {
            return RegistrationBaselineValidation.Fail(
                "BaselineReviewCycleHours must be greater than 0 and at most 10000.",
                "baseline_out_of_range",
                "Baseline review cycle hours must be between 0 and 10,000 (exclusive of zero).");
        }

        if (request.CompanySize is { } companySize
            && !AllowedCompanySizes.Contains(companySize))
        {
            return RegistrationBaselineValidation.Fail(
                "CompanySize is not a supported band.",
                "company_size_invalid",
                "Company size must be one of the allowed options when provided.");
        }

        if (request.ArchitectureTeamSize is <= 0 or > 10_000)
        {
            return RegistrationBaselineValidation.Fail(
                "ArchitectureTeamSize must be between 1 and 10000 when provided.",
                "architecture_team_size_out_of_range",
                "Architecture team size must be between 1 and 10,000 when provided.");
        }

        if (request.IndustryVertical is { } ind
            && !IndustryVerticals.Contains(ind))
        {
            return RegistrationBaselineValidation.Fail(
                "IndustryVertical is not in the curated list.",
                "industry_vertical_invalid",
                "Industry must be one of the listed options (or Other) when provided.");
        }

        if (string.Equals(request.IndustryVertical, "Other", StringComparison.Ordinal)
            && string.IsNullOrWhiteSpace(request.IndustryVerticalOther))
        {
            return RegistrationBaselineValidation.Fail(
                "IndustryVerticalOther is required when IndustryVertical is Other.",
                "industry_other_required",
                "Please specify your industry when you select \"Other.\"");
        }

        return RegistrationBaselineValidation.Ok(normalizedSource);
    }

    public static string? NormalizeBaselineReviewCycleSource(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string trimmed = raw.Trim();
        StringBuilder builder = new(trimmed.Length);

        foreach (char c in trimmed.Where(static c => !char.IsControl(c)))
            builder.Append(c);

        if (builder.Length == 0)
            return null;

        string s = builder.ToString();

        return s.Length > 256 ? s[..256] : s;
    }
}

/// <summary>Result of <see cref="RegistrationRequestBaselineValidator.Validate"/>.</summary>
public readonly record struct RegistrationBaselineValidation
{
    public bool IsValid
    {
        get;
        init;
    }

    public string? NormalizedSource
    {
        get;
        init;
    }

    public string? LogMessage
    {
        get;
        init;
    }

    public string? Code
    {
        get;
        init;
    }

    public string? UserMessage
    {
        get;
        init;
    }

    public static RegistrationBaselineValidation Ok(string? normalizedSource) =>
        new() { IsValid = true, NormalizedSource = normalizedSource };

    public static RegistrationBaselineValidation Fail(string logMessage, string code, string userMessage) =>
        new()
        {
            IsValid = false,
            LogMessage = logMessage,
            Code = code,
            UserMessage = userMessage
        };
}
