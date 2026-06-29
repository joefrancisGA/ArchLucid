using System.Text.Json.Serialization;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Terminal outcome persisted as the background job result file for operator polling.</summary>
public sealed record ItsmOutboundCreateJobResult(
    [property: JsonConverter(typeof(JsonStringEnumConverter))]
    ItsmOutboundCreateTerminalKind Kind,
    string Provider,
    string? ExternalKey,
    string? UserMessage,
    int? VendorStatusCode);
