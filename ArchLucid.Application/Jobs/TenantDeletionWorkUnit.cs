using System.Text.Json.Serialization;

namespace ArchLucid.Application.Jobs;

[method: JsonConstructor]
public sealed record TenantDeletionWorkUnit(TenantDeletionJobPayload Payload) : BackgroundJobWorkUnit
{
    public TenantDeletionJobPayload Payload
    {
        get;
        init;
    } = Payload ?? throw new ArgumentNullException(nameof(Payload));
}
