using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Integrations.Itsm;

/// <inheritdoc cref="IItsmInboundPayloadReader" />
public sealed class ItsmInboundServiceNowPayloadReader : IItsmInboundPayloadReader
{
    private const int MaxItsmExternalKeyLength = 256;

    private const int MaxServiceNowStateLength = 64;

    private static readonly Regex ServiceNowSysIdRegex = new(
        "^[a-fA-F0-9]{32}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <inheritdoc />
    public bool TryRead(JsonElement root, out ItsmInboundPayloadReadResult result)
    {
        result = null!;

        if (!TryReadServiceNowKeys(root, out ServiceNowInboundKeysReadResult keys) ||
            string.IsNullOrWhiteSpace(keys.ExternalKey) ||
            string.IsNullOrWhiteSpace(keys.StatusValue))
            return false;

        string externalKey = keys.ExternalKey.Trim();
        string stateNormalized = keys.StatusValue.Trim();

        if (externalKey.Length > MaxItsmExternalKeyLength)
            throw new ItsmInboundPayloadValidationException(
                externalKey,
                "external_key_too_long",
                "ServiceNow sys_id exceeds maximum stored length.");

        if (!ServiceNowSysIdRegex.IsMatch(externalKey))
            throw new ItsmInboundPayloadValidationException(
                externalKey,
                "sys_id_invalid_format",
                "ServiceNow incident key must be a 32-character hexadecimal sys_id (correlation uses the create response sys_id).");

        if (stateNormalized.Length > MaxServiceNowStateLength)
            throw new ItsmInboundPayloadValidationException(
                externalKey,
                "state_too_long",
                "ServiceNow incident state value exceeds maximum length.");

        result = new ItsmInboundPayloadReadResult
        {
            ExternalKey = externalKey,
            StatusValue = stateNormalized,
            AlternateStatusValue = keys.AlternateStatusValue,
        };

        return true;
    }

    /// <summary>Reads ServiceNow <c>sys_id</c> (or camelCase <c>sysId</c>) — inbound correlation matches outbound registration by sys_id.</summary>
    private static bool TryReadServiceNowKeys(JsonElement root, out ServiceNowInboundKeysReadResult keys)
    {
        keys = new ServiceNowInboundKeysReadResult();

        string? externalKey = null;
        string? stateFromState = null;
        string? stateFromIncident = null;

        if (ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "sys_id", out JsonElement sid))
            externalKey = sid.GetString();

        if (externalKey is null && ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "sysId", out JsonElement sid2))
            externalKey = sid2.GetString();

        if (ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "state", out JsonElement st))
            stateFromState = ItsmInboundJsonElementReader.ReadStringOrRawText(st);

        if (ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "incident_state", out JsonElement ist))
            stateFromIncident = ItsmInboundJsonElementReader.ReadStringOrRawText(ist);

        string? statusValue = stateFromState;

        if (string.IsNullOrWhiteSpace(statusValue))
            statusValue = stateFromIncident;

        keys = new ServiceNowInboundKeysReadResult
        {
            ExternalKey = externalKey,
            StatusValue = statusValue,
            AlternateStatusValue = ResolveAlternateStatusValue(stateFromState, stateFromIncident, statusValue),
        };

        return !string.IsNullOrWhiteSpace(externalKey);
    }

    private static string? ResolveAlternateStatusValue(string? stateFromState, string? stateFromIncident, string? selectedStatusValue)
    {
        if (string.IsNullOrWhiteSpace(stateFromIncident))
            return null;

        string incidentNormalized = stateFromIncident.Trim();

        if (string.IsNullOrWhiteSpace(stateFromState))
            return null;

        string stateNormalized = stateFromState.Trim();

        if (string.Equals(stateNormalized, incidentNormalized, StringComparison.OrdinalIgnoreCase))
            return null;

        if (string.Equals(selectedStatusValue?.Trim(), incidentNormalized, StringComparison.OrdinalIgnoreCase))
            return null;

        return incidentNormalized;
    }

    private sealed class ServiceNowInboundKeysReadResult
    {
        public string? ExternalKey
        {
            get;
            init;
        }

        public string? StatusValue
        {
            get;
            init;
        }

        public string? AlternateStatusValue
        {
            get;
            init;
        }
    }
}
