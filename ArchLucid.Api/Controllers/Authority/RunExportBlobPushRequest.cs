namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Request body for <c>POST /v1/artifacts/runs/{runId}/export/push</c>.</summary>
public sealed class RunExportBlobPushRequest
{
    /// <summary>
    ///     Azure Blob Storage SAS URL with <c>Write</c> or <c>Create</c> permission.
    ///     The ZIP is uploaded via HTTP PUT as a <c>BlockBlob</c>.
    /// </summary>
    public string DestinationSasUrl { get; init; } = string.Empty;
}
