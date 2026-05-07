namespace ArchLucid.Application.Alerts;

/// <summary>Redacts routing destinations so webhook URLs and inbox addresses never leave the API verbatim.</summary>
public static class IntegrationDestinationRedactor
{
    public static string Redact(string? destination)
    {
        if (string.IsNullOrWhiteSpace(destination))
            return "";

        string d = destination.Trim();

        if (d.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            d.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return "[webhook-url-redacted]";

        return d.Contains('@', StringComparison.Ordinal) ? "[email-redacted]" : "[destination-redacted]";
    }
}
