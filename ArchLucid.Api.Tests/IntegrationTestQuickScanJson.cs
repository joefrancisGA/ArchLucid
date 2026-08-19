using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Api.Tests;

/// <summary>
///     JSON options for Quick Scan HTTP contract assertions (string enums + legacy severity labels).
/// </summary>
internal static class IntegrationTestQuickScanJson
{
    internal static JsonSerializerOptions Options { get; } = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new EvalCorpusFindingSeverityJsonConverter(),
            new JsonStringEnumConverter(null),
        },
    };
}
