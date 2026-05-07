namespace ArchLucid.Application.Notifications.Email.Models;
public sealed record TrialWelcomeEmailModel(string OrganizationHint, string ProductName, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(OrganizationHint, ProductName, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String organizationHint, System.String productName, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(organizationHint);
        ArgumentNullException.ThrowIfNull(productName);
        return (byte)0;
    }
}

public sealed record TrialFirstRunEmailModel(string ProductName, string GettingStartedUrl, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProductName, GettingStartedUrl, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String productName, System.String gettingStartedUrl, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(productName);
        ArgumentNullException.ThrowIfNull(gettingStartedUrl);
        return (byte)0;
    }
}

public sealed record TrialMidTrialEmailModel(string ProductName, string DashboardUrl, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProductName, DashboardUrl, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String productName, System.String dashboardUrl, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(productName);
        ArgumentNullException.ThrowIfNull(dashboardUrl);
        return (byte)0;
    }
}

public sealed record TrialApproachingRunLimitEmailModel(string ProductName, int RunsUsed, int RunsLimit, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProductName, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String productName, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(productName);
        return (byte)0;
    }
}

public sealed record TrialExpiringSoonEmailModel(string ProductName, int DaysRemaining, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProductName, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String productName, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(productName);
        return (byte)0;
    }
}

public sealed record TrialExpiredEmailModel(string ProductName, string ExportHelpUrl, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProductName, ExportHelpUrl, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String productName, System.String exportHelpUrl, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(productName);
        ArgumentNullException.ThrowIfNull(exportHelpUrl);
        return (byte)0;
    }
}

public sealed record TrialConvertedEmailModel(string ProductName, string Tier, string? LogoImageUrl = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProductName, Tier, LogoImageUrl);
    private static byte __ValidatePrimaryConstructorArguments(System.String productName, System.String tier, System.String? logoImageUrl)
    {
        ArgumentNullException.ThrowIfNull(productName);
        ArgumentNullException.ThrowIfNull(tier);
        return (byte)0;
    }
}