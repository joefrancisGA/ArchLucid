using ArchiForge.Decisioning.Alerts;

namespace ArchiForge.Decisioning.Alerts.Delivery;

public static class AlertSeverityComparer
{
    public static int ToRank(string severity)
    {
        return severity switch
        {
            AlertSeverity.Info => 1,
            AlertSeverity.Warning => 2,
            AlertSeverity.High => 3,
            AlertSeverity.Critical => 4,
            _ => 0,
        };
    }

    public static bool MeetsMinimum(string actualSeverity, string minimumSeverity)
    {
        return ToRank(actualSeverity) >= ToRank(minimumSeverity);
    }
}
