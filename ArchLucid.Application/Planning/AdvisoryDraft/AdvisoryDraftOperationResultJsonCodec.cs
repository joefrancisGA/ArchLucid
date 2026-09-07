using System.Text.Json;

using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

internal static class AdvisoryDraftOperationResultJsonCodec
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    internal static string? Serialize(DraftArchitectureRequestResponse? result)
    {
        if (result is null)
        {
            return null;
        }

        return JsonSerializer.Serialize(result, Options);
    }

    internal static DraftArchitectureRequestResponse? Deserialize(string? resultJson)
    {
        if (string.IsNullOrWhiteSpace(resultJson))
        {
            return null;
        }

        return JsonSerializer.Deserialize<DraftArchitectureRequestResponse>(resultJson, Options);
    }
}
