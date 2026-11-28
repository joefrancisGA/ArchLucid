using System.Buffers;
using System.Security.Cryptography;

using static ArchLucid.Application.Replay.Historical.HistoricalReplayDescriptorValidation;

namespace ArchLucid.Application.Replay.Historical;

/// <summary>Checks retained evidence against an already authorized and independently pinned historical descriptor. Never replays a run.</summary>
public sealed class HistoricalReplayCompletenessService(IScopedHistoricalArtifactReader reader)
{
    public const int DescriptorVersion = 1;
    private readonly IScopedHistoricalArtifactReader artifacts = reader ?? throw new ArgumentNullException(nameof(reader));

    public static string DescriptorSha256(HistoricalReplayDescriptor raw)
    {
        ArgumentNullException.ThrowIfNull(raw);
        return raw.Version == DescriptorVersion && Freeze(raw) is { } normalized
            ? Digest(normalized)
            : throw new ArgumentException("Historical replay descriptor is malformed or unsupported.", nameof(raw));
    }

    public async Task<HistoricalReplayAssessment> AssessAsync(HistoricalReplayTrust trust, HistoricalReplayDescriptor? raw,
        HistoricalReplayMode mode, HistoricalExecutionVersions? compatibleRuntime = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trust);
        cancellationToken.ThrowIfCancellationRequested();
        if (!ValidAnchor(trust.Source) || !Enum.IsDefined(mode) || (trust.DescriptorSha256 is not null && !IsHash(trust.DescriptorSha256)))
            return Reject(mode, "invalid_authorized_source_or_mode");
        if (raw is null)
            return new(mode, trust.DescriptorSha256 is null ? HistoricalReplayReadiness.LegacyDescriptorUnavailable
                : HistoricalReplayReadiness.Unavailable, null, HistoricalCoverage.Unknown, [],
                Array.AsReadOnly(new[] { new HistoricalReplayIssue("descriptor", "no_historical_descriptor_available") }));
        if (trust.DescriptorSha256 is null)
            return Reject(mode, "descriptor_has_no_independent_commitment");
        if (raw.Version != DescriptorVersion)
            return Reject(mode, "unsupported_descriptor_version");
        if (Freeze(raw) is not { } descriptor || !EqualAnchors(descriptor.Source, trust.Source))
            return Reject(mode, "malformed_descriptor_or_source_mismatch");

        string digest = Digest(descriptor);
        if (!SameHash(digest, trust.DescriptorSha256))
            return Reject(mode, "descriptor_commitment_mismatch");

        var (required, missing) = HistoricalReplayRequirements.Resolve(descriptor, mode, compatibleRuntime);
        if (descriptor.Artifacts.Where(row => required.Contains(row.ArtifactId)
                && row.RecordedAvailability == HistoricalArtifactAvailability.Exact).Sum(row => row.Length!.Value) > MaxReadBytes)
            return Reject(mode, "required_artifact_read_budget_exceeded");

        List<HistoricalReplayIssue> issues = [.. missing];
        List<HistoricalArtifactCheck> results = [];
        foreach (var pin in descriptor.Artifacts)
        {
            cancellationToken.ThrowIfCancellationRequested();
            bool isRequired = required.Contains(pin.ArtifactId);
            HistoricalArtifactAvailability observed = pin.RecordedAvailability;
            if (observed == HistoricalArtifactAvailability.Exact)
            {
                if (!isRequired)
                    observed = HistoricalArtifactAvailability.NotChecked;
                else
                {
                    var identity = new HistoricalArtifactIdentity(descriptor.Source.Run, pin.ArtifactId, pin.Role,
                        pin.Schema, pin.StageId, pin.AttemptId);
                    var result = await CheckAsync(identity, pin, cancellationToken);
                    if (result.ScopeMismatch)
                        return Reject(mode, "artifact_reader_returned_wrong_scope_or_lineage");
                    observed = result.Availability;
                }
            }
            results.Add(new(pin.ArtifactId, pin.Role, isRequired, pin.RecordedAvailability, observed));
            if (isRequired && observed != HistoricalArtifactAvailability.Exact)
                issues.Add(new(pin.ArtifactId, "required_artifact_not_exact"));
        }

        cancellationToken.ThrowIfCancellationRequested();
        var output = issues.Count == 0 ? HistoricalReplayReadiness.Ready
            : results.Any(row => row.Required && row.ObservedAvailability == HistoricalArtifactAvailability.Exact)
                ? HistoricalReplayReadiness.Partial : HistoricalReplayReadiness.Unavailable;
        return new(mode, output, digest, descriptor.SourceCoverage, FreezeRows(results), FreezeRows(issues
            .OrderBy(issue => issue.Subject, StringComparer.Ordinal).ThenBy(issue => issue.Reason, StringComparer.Ordinal)));
    }

    private async Task<(HistoricalArtifactAvailability Availability, bool ScopeMismatch)> CheckAsync(HistoricalArtifactIdentity expected,
        HistoricalArtifactPin pin, CancellationToken cancellationToken)
    {
        try
        {
            var read = await artifacts.OpenReadAsync(expected, cancellationToken);
            if (read is null)
                return (HistoricalArtifactAvailability.Missing, false);

            await using var stream = read.Content;
            if (read.Identity is not { } echoed || (echoed with { Schema = expected.Schema }) != expected)
                return (HistoricalArtifactAvailability.AccessDenied, true);
            if (!string.Equals(echoed.Schema, expected.Schema, StringComparison.Ordinal))
                return (HistoricalArtifactAvailability.Incompatible, false);
            if (!Enum.IsDefined(read.Availability) || read.Availability == HistoricalArtifactAvailability.NotChecked)
                return (HistoricalArtifactAvailability.Unknown, false);
            if (read.Availability != HistoricalArtifactAvailability.Exact)
                return (read.Availability, false);
            if (stream is null)
                return (HistoricalArtifactAvailability.Missing, false);
            if (!stream.CanRead)
                return (HistoricalArtifactAvailability.Unknown, false);

            return (await MatchesContentAsync(stream, pin.Length!.Value, pin.Sha256!, cancellationToken)
                ? HistoricalArtifactAvailability.Exact : HistoricalArtifactAvailability.Tampered, false);
        }
        catch (UnauthorizedAccessException)
        {
            return (HistoricalArtifactAvailability.AccessDenied, false);
        }
        catch (IOException)
        {
            return (HistoricalArtifactAvailability.Unknown, false);
        }
    }

    private static async Task<bool> MatchesContentAsync(Stream stream, long expectedLength, string expectedHash,
        CancellationToken cancellationToken)
    {
        const int ChunkSize = 64 * 1024;
        byte[] buffer = ArrayPool<byte>.Shared.Rent(ChunkSize);
        try
        {
            using var sha = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
            long remaining = expectedLength;
            while (remaining != 0)
            {
                int read = await stream.ReadAsync(buffer.AsMemory(0, (int)Math.Min(ChunkSize, remaining)), cancellationToken);
                if (read == 0)
                    return false;
                sha.AppendData(buffer, 0, read);
                remaining -= read;
            }

            // Do not accept a matching prefix, or drain an untrusted artifact larger than its committed length.
            return await stream.ReadAsync(buffer.AsMemory(0, 1), cancellationToken) == 0
                && SameHash(Convert.ToHexString(sha.GetHashAndReset()), expectedHash);
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
        }
    }

    private static HistoricalReplayAssessment Reject(HistoricalReplayMode mode, string reason) =>
        new(mode, HistoricalReplayReadiness.Rejected, null, HistoricalCoverage.Unknown, [],
            Array.AsReadOnly(new[] { new HistoricalReplayIssue("descriptor", reason) }));
}
