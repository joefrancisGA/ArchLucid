using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

internal static class PolicyPackContentDocumentJson
{
    private static readonly JsonSerializerOptions Options = ContractJson.CamelCaseIgnoreNullCompact;

    internal static PolicyPackContentDocument? TryDeserialize(string? contentJson)
    {
        if (string.IsNullOrWhiteSpace(contentJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<PolicyPackContentDocument>(contentJson, Options);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
