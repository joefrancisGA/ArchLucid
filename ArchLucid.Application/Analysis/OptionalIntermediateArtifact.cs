using System.Security.Cryptography;

using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.Analysis;

/// <summary>
/// Validates a recomputable derivative against an independently loaded, authorized reference.
/// This is not a result receipt, authorization check, or checkpoint completion signal.
/// </summary>
public static class OptionalIntermediateArtifact
{
    public const int FormatVersion = 1;

    public sealed record Reference(
        AnalysisRecoveryStageKey Stage,
        string InputVersion,
        string ProducerVersion,
        string ContentSha256,
        long Bytes,
        int Format,
        DateTimeOffset ExpiresAtUtc);

    public enum Disposition
    {
        Usable,
        Missing,
        Incompatible,
        Expired,
        OutsideBudget,
        InvalidContent,
    }

    public static Disposition Validate(
        Reference? reference,
        AnalysisRecoveryStageKey authorizedStage,
        string expectedInputVersion,
        string expectedProducerVersion,
        ReadOnlySpan<byte> payload,
        long maximumBytes,
        DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(authorizedStage);

        if (reference is null || payload.IsEmpty)
            return Disposition.Missing;

        if (reference.Format != FormatVersion || reference.Stage != authorizedStage ||
            string.IsNullOrWhiteSpace(expectedInputVersion) || string.IsNullOrWhiteSpace(expectedProducerVersion) ||
            !string.Equals(reference.InputVersion, expectedInputVersion, StringComparison.Ordinal) ||
            !string.Equals(reference.ProducerVersion, expectedProducerVersion, StringComparison.Ordinal))
            return Disposition.Incompatible;

        if (reference.ExpiresAtUtc <= nowUtc)
            return Disposition.Expired;

        if (maximumBytes <= 0 || reference.Bytes <= 0 ||
            reference.Bytes > maximumBytes || payload.Length > maximumBytes)
            return Disposition.OutsideBudget;

        if (reference.Bytes != payload.Length ||
            !string.Equals(reference.ContentSha256, Convert.ToHexString(SHA256.HashData(payload)), StringComparison.Ordinal))
            return Disposition.InvalidContent;

        return Disposition.Usable;
    }
}
