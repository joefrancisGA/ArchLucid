using System.Text.Json.Serialization;

using ArchLucid.Application.Findings.FindingVerification;

namespace ArchLucid.Application.Jobs;

[method: JsonConstructor]
public sealed record FindingVerificationWorkUnit(FindingVerificationJobPayload Payload) : BackgroundJobWorkUnit
{
    public FindingVerificationJobPayload Payload
    {
        get;
        init;
    } = Payload ?? throw new ArgumentNullException(nameof(Payload));
}
