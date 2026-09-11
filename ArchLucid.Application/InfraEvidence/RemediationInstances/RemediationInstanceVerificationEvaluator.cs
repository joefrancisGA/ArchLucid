using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public static class RemediationInstanceVerificationEvaluator
{
    public static RemediationInstanceVerificationResult Evaluate(
        RemediationInstanceRecord instance,
        RemediationPatternVersionContent content,
        AzureInventorySnapshotDetailReadModel verificationSnapshot,
        Guid executionSnapshotId,
        RemediationPathNarrative? pathNarrative = null,
        RemediationPathVerificationContext? pathVerificationContext = null)
    {
        ArgumentNullException.ThrowIfNull(instance);
        ArgumentNullException.ThrowIfNull(content);
        ArgumentNullException.ThrowIfNull(verificationSnapshot);

        if (verificationSnapshot.Header.SnapshotId == executionSnapshotId)
        {
            return Failed(
                instance,
                ["Verification snapshot must be captured after the execution snapshot."]);
        }

        List<string> failures = [];

        if (instance.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
        {
            AzureInventoryResourceRecord? resource = verificationSnapshot.Resources
                .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

            if (resource is null)
                failures.Add("Target cloud resource is not present in the verification snapshot.");
        }

        HashSet<string> evaluatedQueries = new(StringComparer.OrdinalIgnoreCase);

        foreach (string query in content.Execution?.VerificationQueries ?? [])
        {
            if (string.IsNullOrWhiteSpace(query) || !evaluatedQueries.Add(query.Trim()))
            {
                continue;
            }

            if (!EvaluateQuery(
                    query,
                    verificationSnapshot,
                    instance.CloudResourceId,
                    pathNarrative,
                    pathVerificationContext,
                    out string? failure))
            {
                failures.Add(failure ?? $"Verification query failed: {query}");
            }
        }

        if (pathNarrative is not null)
        {
            foreach (string query in pathNarrative.VerificationQueries)
            {
                if (string.IsNullOrWhiteSpace(query) || !evaluatedQueries.Add(query.Trim()))
                {
                    continue;
                }

                if (!EvaluateQuery(
                        query,
                        verificationSnapshot,
                        instance.CloudResourceId,
                        pathNarrative,
                        pathVerificationContext,
                        out string? failure))
                {
                    failures.Add(failure ?? $"Verification query failed: {query}");
                }
            }
        }

        bool passed = failures.Count == 0;

        return new RemediationInstanceVerificationResult
        {
            Passed = passed,
            Failures = failures,
            ResultJson = JsonSerializer.Serialize(new
            {
                passed,
                failures,
                verificationSnapshotId = verificationSnapshot.Header.SnapshotId,
                executionSnapshotId,
            }),
        };
    }

    private static RemediationInstanceVerificationResult Failed(
        RemediationInstanceRecord instance,
        IReadOnlyList<string> failures) =>
        new()
        {
            Passed = false,
            Failures = failures,
            ResultJson = JsonSerializer.Serialize(new { passed = false, failures }),
        };

    private static bool EvaluateQuery(
        string query,
        AzureInventorySnapshotDetailReadModel snapshot,
        Guid? cloudResourceId,
        RemediationPathNarrative? pathNarrative,
        RemediationPathVerificationContext? pathVerificationContext,
        out string? failure)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            failure = null;
            return true;
        }

        string trimmed = query.Trim();

        if (trimmed.StartsWith("path:hash-absent=", StringComparison.OrdinalIgnoreCase))
        {
            return EvaluatePathHashAbsentQuery(trimmed, pathNarrative, pathVerificationContext, out failure);
        }

        if (trimmed.Equals("snapshot.resource.present", StringComparison.OrdinalIgnoreCase))
        {
            if (cloudResourceId is null || cloudResourceId == Guid.Empty)
            {
                failure = "snapshot.resource.present requires CloudResourceId on the instance.";
                return false;
            }

            bool present = snapshot.Resources.Any(resource => resource.CloudResourceId == cloudResourceId);

            if (!present)
            {
                failure = "snapshot.resource.present failed.";
                return false;
            }

            failure = null;
            return true;
        }

        if (trimmed.StartsWith("property:", StringComparison.OrdinalIgnoreCase))
        {
            string expression = trimmed["property:".Length..];
            string[] parts = expression.Split('=', 2);

            if (parts.Length != 2)
            {
                failure = $"Invalid property query '{query}'.";
                return false;
            }

            string propertyKey = parts[0].Trim();
            string expectedValue = parts[1].Trim();

            if (cloudResourceId is null || cloudResourceId == Guid.Empty)
            {
                failure = $"Property query '{query}' requires CloudResourceId on the instance.";
                return false;
            }

            AzureInventoryResourceRecord? resource = snapshot.Resources
                .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

            if (resource is null)
            {
                failure = $"Property query '{query}' failed because resource was not found.";
                return false;
            }

            string? actual = snapshot.Properties
                .Where(property => property.ResourceRowId == resource.ResourceRowId)
                .FirstOrDefault(property =>
                    string.Equals(property.PropertyKey, propertyKey, StringComparison.OrdinalIgnoreCase))
                ?.PropertyValue;

            if (!string.Equals(actual, expectedValue, StringComparison.OrdinalIgnoreCase))
            {
                failure = $"Property query '{query}' expected '{expectedValue}' but found '{actual ?? "(missing)"}'.";
                return false;
            }

            failure = null;
            return true;
        }

        failure = $"Unsupported verification query '{query}'.";
        return false;
    }

    private static bool EvaluatePathHashAbsentQuery(
        string query,
        RemediationPathNarrative? pathNarrative,
        RemediationPathVerificationContext? pathVerificationContext,
        out string? failure)
    {
        string hex = query["path:hash-absent=".Length..].Trim();

        if (pathNarrative is null || pathVerificationContext is null)
        {
            failure = $"Verification query '{query}' requires a path narrative on the instance.";
            return false;
        }

        if (!TryParseHexHash(hex, out byte[] expectedHash))
        {
            failure = $"Invalid path hash in query '{query}'.";
            return false;
        }

        if (!string.Equals(pathNarrative.CanonicalHopHashHex, hex, StringComparison.OrdinalIgnoreCase))
        {
            failure = $"Path hash in query '{query}' does not match the frozen path narrative.";
            return false;
        }

        if (!expectedHash.AsSpan().SequenceEqual(pathVerificationContext.SourcePathCanonicalHash))
        {
            failure = $"Path hash in query '{query}' does not match the frozen path narrative hash bytes.";
            return false;
        }

        bool stillPresent = pathVerificationContext.VerificationSnapshotPaths
            .Any(path => path.CanonicalHopHashSha256.AsSpan().SequenceEqual(expectedHash));

        if (stillPresent)
        {
            failure = $"Verification query '{query}' failed — equivalent path still present in verification snapshot.";
            return false;
        }

        failure = null;
        return true;
    }

    private static bool TryParseHexHash(string hex, out byte[] hash)
    {
        hash = [];

        if (hex.Length != 64)
        {
            return false;
        }

        try
        {
            hash = Convert.FromHexString(hex);
            return hash.Length == 32;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}

public sealed class RemediationInstanceVerificationResult
{
    public bool Passed
    {
        get;
        init;
    }

    public IReadOnlyList<string> Failures
    {
        get;
        init;
    } = [];

    public string ResultJson
    {
        get;
        init;
    } = string.Empty;
}
