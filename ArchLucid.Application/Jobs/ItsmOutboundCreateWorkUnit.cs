using System.Text.Json.Serialization;

using ArchLucid.Application.Integrations.Itsm.Outbound;

namespace ArchLucid.Application.Jobs;

[method: JsonConstructor]
public sealed record ItsmOutboundCreateWorkUnit(ItsmOutboundCreateJobPayload Payload) : BackgroundJobWorkUnit
{
    public ItsmOutboundCreateJobPayload Payload
    {
        get;
        init;
    } = Payload ?? throw new ArgumentNullException(nameof(Payload));
}
