namespace ArchLucid.Application.Notifications.Email.Models;

public sealed record TrialWelcomeEmailModel(string OrganizationHint, string ProductName, string? LogoImageUrl = null)
{
    public string OrganizationHint
    {
        get;
        init;
    } = OrganizationHint ?? throw new ArgumentNullException(nameof(OrganizationHint));

    public string ProductName
    {
        get;
        init;
    } = ProductName ?? throw new ArgumentNullException(nameof(ProductName));
}

public sealed record TrialFirstRunEmailModel(string ProductName, string GettingStartedUrl, string? LogoImageUrl = null)
{
    public string ProductName
    {
        get;
        init;
    } = ProductName ?? throw new ArgumentNullException(nameof(ProductName));

    public string GettingStartedUrl
    {
        get;
        init;
    } = GettingStartedUrl ?? throw new ArgumentNullException(nameof(GettingStartedUrl));
}

public sealed record TrialMidTrialEmailModel(string ProductName, string DashboardUrl, string? LogoImageUrl = null)
{
    public string ProductName
    {
        get;
        init;
    } = ProductName ?? throw new ArgumentNullException(nameof(ProductName));

    public string DashboardUrl
    {
        get;
        init;
    } = DashboardUrl ?? throw new ArgumentNullException(nameof(DashboardUrl));
}

public sealed record TrialApproachingRunLimitEmailModel(string ProductName, int RunsUsed, int RunsLimit, string? LogoImageUrl = null);

public sealed record TrialExpiringSoonEmailModel(string ProductName, int DaysRemaining, string? LogoImageUrl = null);

public sealed record TrialExpiredEmailModel(string ProductName, string ExportHelpUrl, string? LogoImageUrl = null)
{
    public string ProductName
    {
        get;
        init;
    } = ProductName ?? throw new ArgumentNullException(nameof(ProductName));

    public string ExportHelpUrl
    {
        get;
        init;
    } = ExportHelpUrl ?? throw new ArgumentNullException(nameof(ExportHelpUrl));
}

public sealed record TrialConvertedEmailModel(string ProductName, string Tier, string? LogoImageUrl = null)
{
    public string ProductName
    {
        get;
        init;
    } = ProductName ?? throw new ArgumentNullException(nameof(ProductName));

    public string Tier
    {
        get;
        init;
    } = Tier ?? throw new ArgumentNullException(nameof(Tier));
}
