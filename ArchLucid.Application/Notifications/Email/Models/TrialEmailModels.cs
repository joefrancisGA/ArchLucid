namespace ArchLucid.Application.Notifications.Email.Models;

public sealed record TrialWelcomeEmailModel
{
    public string OrganizationHint
    {
        get;
        init;
    }

    public string ProductName
    {
        get;
        init;
    }

    public string? LogoImageUrl
    {
        get;
        init;
    }

    public TrialWelcomeEmailModel(string organizationHint, string productName, string? logoImageUrl = null)
    {
        OrganizationHint = organizationHint ?? throw new ArgumentNullException(nameof(organizationHint));
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        LogoImageUrl = logoImageUrl;
    }
}

public sealed record TrialFirstRunEmailModel
{
    public string ProductName
    {
        get;
        init;
    }

    public string GettingStartedUrl
    {
        get;
        init;
    }

    public string? LogoImageUrl
    {
        get;
        init;
    }

    public TrialFirstRunEmailModel(string productName, string gettingStartedUrl, string? logoImageUrl = null)
    {
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        GettingStartedUrl = gettingStartedUrl ?? throw new ArgumentNullException(nameof(gettingStartedUrl));
        LogoImageUrl = logoImageUrl;
    }
}

public sealed record TrialMidTrialEmailModel
{
    public string ProductName
    {
        get;
        init;
    }

    public string DashboardUrl
    {
        get;
        init;
    }

    public string? LogoImageUrl
    {
        get;
        init;
    }

    public TrialMidTrialEmailModel(string productName, string dashboardUrl, string? logoImageUrl = null)
    {
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        DashboardUrl = dashboardUrl ?? throw new ArgumentNullException(nameof(dashboardUrl));
        LogoImageUrl = logoImageUrl;
    }
}

public sealed record TrialApproachingRunLimitEmailModel(string ProductName, int RunsUsed, int RunsLimit, string? LogoImageUrl = null);

public sealed record TrialExpiringSoonEmailModel(string ProductName, int DaysRemaining, string? LogoImageUrl = null);

public sealed record TrialExpiredEmailModel
{
    public string ProductName
    {
        get;
        init;
    }

    public string ExportHelpUrl
    {
        get;
        init;
    }

    public string? LogoImageUrl
    {
        get;
        init;
    }

    public TrialExpiredEmailModel(string productName, string exportHelpUrl, string? logoImageUrl = null)
    {
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        ExportHelpUrl = exportHelpUrl ?? throw new ArgumentNullException(nameof(exportHelpUrl));
        LogoImageUrl = logoImageUrl;
    }
}

public sealed record TrialConvertedEmailModel
{
    public string ProductName
    {
        get;
        init;
    }

    public string Tier
    {
        get;
        init;
    }

    public string? LogoImageUrl
    {
        get;
        init;
    }

    public TrialConvertedEmailModel(string productName, string tier, string? logoImageUrl = null)
    {
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        Tier = tier ?? throw new ArgumentNullException(nameof(tier));
        LogoImageUrl = logoImageUrl;
    }
}
