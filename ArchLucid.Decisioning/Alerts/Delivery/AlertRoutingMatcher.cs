namespace ArchLucid.Decisioning.Alerts.Delivery;

/// <summary>Evaluates whether an alert matches a routing subscription's severity floor and optional criteria.</summary>
public static class AlertRoutingMatcher
{
    public static bool Matches(AlertRoutingSubscription subscription, AlertRoutingSignal signal)
    {
        ArgumentNullException.ThrowIfNull(subscription);
        ArgumentNullException.ThrowIfNull(signal);

        if (!AlertSeverityComparer.MeetsMinimum(signal.Severity, subscription.MinimumSeverity))
        {
            return false;
        }

        AlertRoutingCriteria criteria = AlertRoutingCriteriaMetadata.Parse(subscription.MetadataJson);

        if (criteria.Severities.Count > 0 &&
            !criteria.Severities.Any(severity =>
                string.Equals(severity, signal.Severity, StringComparison.OrdinalIgnoreCase)))
        {
            return false;
        }

        if (criteria.FindingTypes.Count > 0 &&
            !criteria.FindingTypes.Any(findingType =>
                string.Equals(findingType, signal.FindingType, StringComparison.OrdinalIgnoreCase)))
        {
            return false;
        }

        if (criteria.Tags.Count > 0)
        {
            bool tagMatched = criteria.Tags.Any(requiredTag =>
                signal.Tags.Any(alertTag =>
                    string.Equals(requiredTag, alertTag, StringComparison.OrdinalIgnoreCase)));

            if (!tagMatched)
            {
                return false;
            }
        }

        return true;
    }
}
