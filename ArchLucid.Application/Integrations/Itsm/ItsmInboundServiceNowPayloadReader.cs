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

        if (!TryReadServiceNowKeys(root, out string? externalKeyRaw, out string? stateRaw) ||
            string.IsNullOrWhiteSpace(externalKeyRaw) ||
            string.IsNullOrWhiteSpace(stateRaw))
            return false;

        string externalKey = externalKeyRaw.Trim();

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

        string stateNormalized = stateRaw.Trim();

        if (stateNormalized.Length > MaxServiceNowStateLength)
            throw new ItsmInboundPayloadValidationException(
                externalKey,
                "state_too_long",
                "ServiceNow incident state value exceeds maximum length.");

        result = new ItsmInboundPayloadReadResult
        {
            ExternalKey = externalKey,
            StatusValue = stateNormalized,
        };

        return true;
    }

    /// <summary>Reads ServiceNow <c>sys_id</c> (or camelCase <c>sysId</c>) — inbound correlation matches outbound registration by sys_id.</summary>
    private static bool TryReadServiceNowKeys(JsonElement root, out string? externalKey, out string? state)
    {
        externalKey = null;
        state = null;

        if (ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "sys_id", out JsonElement sid))
            externalKey = sid.GetString();

        if (externalKey is null && ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "sysId", out JsonElement sid2))
            externalKey = sid2.GetString();

        if (ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "state", out JsonElement st))
            state = ItsmInboundJsonElementReader.ReadStringOrRawText(st);

        if (string.IsNullOrWhiteSpace(state) &&
            ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(root, "incident_state", out JsonElement ist))
        {
            state = ItsmInboundJsonElementReader.ReadStringOrRawText(ist);
        }

        return !string.IsNullOrWhiteSpace(externalKey);
    }
}
