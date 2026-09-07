namespace ArchLucid.Application.Exports;

/// <summary>Thrown when ADR 0078 blocks a career export with a named user-safe reason.</summary>
public sealed class CareerArtifactExportBlockedException : InvalidOperationException
{
    public CareerArtifactExportBlockedException(string message, string? blockReasonCode = null)
        : base(message)
    {
        BlockReasonCode = blockReasonCode;
    }

    public string? BlockReasonCode { get; }
}
