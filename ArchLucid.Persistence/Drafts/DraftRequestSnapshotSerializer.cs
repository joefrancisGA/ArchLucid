using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Drafts;

internal static class DraftRequestSnapshotSerializer
{
    private static readonly JsonSerializerOptions SerializerOptions = ContractJson.CamelCaseIgnoreNullCompact;

    internal static string Serialize(DraftRequestResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        return JsonSerializer.Serialize(response, SerializerOptions);
    }

    internal static DraftRequestResponse Deserialize(string readModelJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(readModelJson);

        DraftRequestResponse? response =
            JsonSerializer.Deserialize<DraftRequestResponse>(readModelJson, SerializerOptions);

        if (response is null)
            throw new InvalidOperationException("ReadModelJson did not deserialize to DraftRequestResponse.");

        return response;
    }
}
