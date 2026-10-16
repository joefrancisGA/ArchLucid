using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Serializes <see cref="PilotRunDeltasResponse" /> for sponsor proof ZIP entries using API camelCase names.
/// </summary>
public static class BuyerProofPackDeltasJsonFormatter
{
    public static string Serialize(PilotRunDeltasResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        return JsonSerializer.Serialize(response, ContractJson.CamelCaseIgnoreNullCompact);
    }
}
