using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps inbound Jira / ServiceNow external status values to ArchLucid finding fields (TB-396).</summary>
internal static class ItsmInboundExternalStatusMapper
{
    internal static FindingDisposition? TryMapJiraStatusToDisposition(string statusName, IntegrationsItsmInboundOptions options) =>
        TryMapConfiguredDisposition(options.JiraStatusDispositionMap, statusName, out FindingDisposition disposition)
            ? disposition
            : null;

    internal static FindingDisposition? TryMapServiceNowStateToDisposition(string stateRaw, IntegrationsItsmInboundOptions options) =>
        TryMapConfiguredDisposition(options.ServiceNowStateDispositionMap, stateRaw, out FindingDisposition disposition)
            ? disposition
            : null;

    internal static bool TryMapConfiguredDisposition(
        Dictionary<string, string> rawMap,
        string incomingKey,
        out FindingDisposition disposition)
    {
        disposition = default;

        if (rawMap.Count is 0)
            return false;

        foreach (KeyValuePair<string, string> kv in rawMap.Where(kv => !string.IsNullOrWhiteSpace(kv.Key) && !string.IsNullOrWhiteSpace(kv.Value)).Where(kv => string.Equals(kv.Key.Trim(), incomingKey, StringComparison.OrdinalIgnoreCase)))
        {
            if (!Enum.TryParse(kv.Value.Trim(), ignoreCase: true, out FindingDisposition parsed))
                return false;

            disposition = parsed;

            return true;
        }

        return false;
    }
}
