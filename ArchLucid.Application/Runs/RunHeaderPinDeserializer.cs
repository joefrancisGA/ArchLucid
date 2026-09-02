using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Shared deserialization for create-time pin JSON on <c>dbo.Runs</c> headers.
/// </summary>
public static class RunHeaderPinDeserializer
{
    public static bool TryDeserializePolicyPackRows(string json, out PinnedPolicyPackRow[] rows)
    {
        rows = [];

        try
        {
            PinnedPolicyPackRow[]? parsed = JsonSerializer.Deserialize<PinnedPolicyPackRow[]>(
                json,
                ContractJson.CamelCaseIgnoreNullCompact);

            if (parsed is { Length: > 0 })
            {
                rows = parsed;
                return true;
            }
        }
        catch (JsonException)
        {
        }

        return false;
    }

    public static bool TryDeserializeEvidenceRows(string json, out PinnedEvidencePackageRow[] rows)
    {
        rows = [];

        try
        {
            PinnedEvidencePackageRow[]? parsed = JsonSerializer.Deserialize<PinnedEvidencePackageRow[]>(
                json,
                ContractJson.CamelCaseIgnoreNullCompact);

            if (parsed is { Length: > 0 })
            {
                rows = parsed;
                return true;
            }
        }
        catch (JsonException)
        {
        }

        return false;
    }
}
