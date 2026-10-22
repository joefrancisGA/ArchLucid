using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Findings;

/// <summary>Maps IE-12 operational security exceptions to open-commitment waiver signals (DX-68).</summary>
public static class OpenCommitmentOperationalExceptionClassifier
{
    public static IReadOnlyList<OpenCommitmentSignal> Classify(
        IReadOnlyList<OperationalSecurityExceptionRecord> operationalExceptions,
        IReadOnlyList<OpenCommitmentSignal> existingSignals,
        IReadOnlySet<string> findingsPresentOnGraph,
        IReadOnlySet<string> graphCloudResourceTokens,
        DateTimeOffset now,
        int waiverExpiryWarningDays)
    {
        ArgumentNullException.ThrowIfNull(operationalExceptions);
        ArgumentNullException.ThrowIfNull(existingSignals);
        ArgumentNullException.ThrowIfNull(findingsPresentOnGraph);
        ArgumentNullException.ThrowIfNull(graphCloudResourceTokens);

        HashSet<(string FindingId, OpenCommitmentSignalKind Kind)> existingWaiverKeys = existingSignals
            .Where(static signal =>
                signal.Kind is OpenCommitmentSignalKind.ExpiringWaiver or OpenCommitmentSignalKind.ExpiredWaiver)
            .Select(static signal => (signal.SourceFindingId, signal.Kind))
            .ToHashSet();

        List<OpenCommitmentSignal> signals = [];

        foreach (OperationalSecurityExceptionRecord exception in operationalExceptions)
        {
            if (exception.Status == OperationalSecurityExceptionStatus.Revoked)
            {
                continue;
            }

            string? sourceFindingId = ResolveSourceFindingId(exception);

            if (sourceFindingId is null)
            {
                continue;
            }

            if (!IsStillAttached(sourceFindingId, exception.CloudResourceId, findingsPresentOnGraph, graphCloudResourceTokens))
            {
                continue;
            }

            OpenCommitmentSignalKind? kind = ResolveKind(exception, now, waiverExpiryWarningDays);

            if (kind is null)
            {
                continue;
            }

            if (existingWaiverKeys.Contains((sourceFindingId, kind.Value)))
            {
                continue;
            }

            DateTimeOffset expiry = new(exception.ExpirationUtc, TimeSpan.Zero);
            int dayDelta = kind.Value == OpenCommitmentSignalKind.ExpiredWaiver
                ? (int)Math.Floor((now - expiry).TotalDays)
                : (int)Math.Ceiling((expiry - now).TotalDays);

            signals.Add(new OpenCommitmentSignal
            {
                Kind = kind.Value,
                SourceFindingId = sourceFindingId,
                DueOrExpiryUtc = expiry,
                ReasonToken = "operational-security-exception",
                DaysOverdueOrUntilExpiry = dayDelta,
            });
        }

        return signals;
    }

    private static OpenCommitmentSignalKind? ResolveKind(
        OperationalSecurityExceptionRecord exception,
        DateTimeOffset now,
        int waiverExpiryWarningDays)
    {
        DateTimeOffset expiry = new(exception.ExpirationUtc, TimeSpan.Zero);

        if (exception.Status == OperationalSecurityExceptionStatus.Expired || expiry <= now)
        {
            return OpenCommitmentSignalKind.ExpiredWaiver;
        }

        DateTimeOffset warningThreshold = now.AddDays(waiverExpiryWarningDays);

        if (expiry <= warningThreshold)
        {
            return OpenCommitmentSignalKind.ExpiringWaiver;
        }

        return null;
    }

    private static string? ResolveSourceFindingId(OperationalSecurityExceptionRecord exception)
    {
        if (exception.FindingId is Guid findingGuid && findingGuid != Guid.Empty)
        {
            return findingGuid.ToString("N");
        }

        if (exception.CloudResourceId is Guid cloudResourceGuid && cloudResourceGuid != Guid.Empty)
        {
            return $"operational-exception:{cloudResourceGuid:N}";
        }

        return null;
    }

    private static bool IsStillAttached(
        string sourceFindingId,
        Guid? cloudResourceId,
        IReadOnlySet<string> findingsPresentOnGraph,
        IReadOnlySet<string> graphCloudResourceTokens)
    {
        if (findingsPresentOnGraph.Contains(sourceFindingId))
        {
            return true;
        }

        if (cloudResourceId is null || cloudResourceId == Guid.Empty)
        {
            return false;
        }

        string token = cloudResourceId.Value.ToString("N");

        return graphCloudResourceTokens.Contains(token)
            || graphCloudResourceTokens.Contains(cloudResourceId.Value.ToString("D"));
    }
}
