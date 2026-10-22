using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Api.Tests;

/// <summary>
///     JSON options aligned with trace endpoints that emit <see cref="AgentType" /> dispatch keys (e.g. <c>topology</c>).
/// </summary>
internal static class IntegrationTestTraceJson
{
    internal static JsonSerializerOptions Options { get; } = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null), new AgentTypeJsonConverter() },
    };
}
