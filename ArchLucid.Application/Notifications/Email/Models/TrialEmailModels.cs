namespace ArchLucid.Application.Notifications.Email.Models;

public sealed record TrialWelcomeEmailModel(string OrganizationHint, string ProductName);

public sealed record TrialFirstRunEmailModel(string ProductName, string GettingStartedUrl);

public sealed record TrialMidTrialEmailModel(string ProductName, string DashboardUrl);

public sealed record TrialApproachingRunLimitEmailModel(string ProductName, int RunsUsed, int RunsLimit);

public sealed record TrialExpiringSoonEmailModel(string ProductName, int DaysRemaining);

public sealed record TrialExpiredEmailModel(string ProductName, string ExportHelpUrl);

public sealed record TrialConvertedEmailModel(string ProductName, string Tier);
