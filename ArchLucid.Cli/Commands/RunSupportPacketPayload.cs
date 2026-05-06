using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed record RunSupportPacketPayload(
    string ApiBaseUrl,
    string RunId,
    string Status,
    string RequestId,
    DateTime CreatedUtc,
    DateTime? CompletedUtc,
    string? CurrentManifestVersion,
    int SubmittedAgentResultsCount,
    string? OtelTraceId,
    bool? RealModeFellBackToSimulator,
    string? VersionJsonLine,
    string NextStepHint);
