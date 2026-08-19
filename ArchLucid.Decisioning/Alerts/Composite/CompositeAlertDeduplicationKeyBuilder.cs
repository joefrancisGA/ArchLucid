namespace ArchLucid.Decisioning.Alerts.Composite;

/// <summary>Compatibility shim; canonical implementation is <see cref="ArchLucid.Core.Alerts.Composite.CompositeAlertDeduplicationKeyBuilder" />.</summary>
public static class CompositeAlertDeduplicationKeyBuilder
{
    public static string Build(CompositeAlertRule rule, AlertEvaluationContext context)
    {
        ArgumentNullException.ThrowIfNull(rule);
        ArgumentNullException.ThrowIfNull(context);

        return ArchLucid.Core.Alerts.Composite.CompositeAlertDeduplicationKeyBuilder.Build(rule, context);
    }
}
