using System.Diagnostics.Tracing;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>Subscribes to Microsoft.Data.SqlClient EventSource event counters for pool observability.</summary>
internal sealed class SqlClientPoolEventCounterListener : EventListener
{
    private static readonly Lazy<SqlClientPoolEventCounterListener> Instance =
        new(static () => new SqlClientPoolEventCounterListener());

    private SqlClientPoolEventCounterListener()
    {
    }

    internal static void EnsureStarted() => _ = Instance.Value;

    protected override void OnEventSourceCreated(EventSource eventSource)
    {
        if (string.Equals(eventSource.Name, "Microsoft.Data.SqlClient.EventSource", StringComparison.Ordinal))
            EnableEvents(eventSource, EventLevel.Informational, EventKeywords.All);
    }

    protected override void OnEventWritten(EventWrittenEventArgs eventData)
    {
        if (!string.Equals(eventData.EventName, "EventCounters", StringComparison.Ordinal))
            return;

        if (eventData.Payload is null || eventData.Payload.Count == 0)
            return;

        if (eventData.Payload[0] is not IDictionary<string, object> payload)
            return;

        if (!payload.TryGetValue("Name", out object? nameObj) || nameObj is not string name)
            return;

        if (!payload.TryGetValue("Mean", out object? meanObj))
            return;

        long mean = ConvertMeanToInt64(meanObj);

        switch (name)
        {
            case "active-hard-connections":
            case "active-soft-connections":
                SqlClientMetrics.UpdateActiveConnections(mean);
                break;

            case "free-soft-connections":
            case "soft-connects":
                SqlClientMetrics.UpdateIdleConnections(mean);
                break;

            case "connection-pool-wait-time":
                SqlClientMetrics.UpdatePoolWaitTimeMs(mean);
                break;
        }
    }

    private static long ConvertMeanToInt64(object meanObj) =>
        meanObj switch
        {
            double d => (long)Math.Round(d),
            float f => (long)Math.Round(f),
            long l => l,
            int i => i,
            _ => 0
        };
}
