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
        DateTime? executionCapturedUtc,
        RemediationPathNarrative? pathNarrative = null,
        RemediationPathVerificationContext? pathVerificationContext = null,
        DateTime? changeImplementedUtc = null)
    {
        ArgumentNullException.ThrowIfNull(instance);
        ArgumentNullException.ThrowIfNull(content);
        ArgumentNullException.ThrowIfNull(verificationSnapshot);

        List<string> failures = [];

        if (verificationSnapshot.Header.SnapshotId == executionSnapshotId)
        {
            failures.Add("Verification chronology failed: verification snapshot must not reuse the execution snapshot.");
        }

        if (executionCapturedUtc is null)
        {
            failures.Add("Verification chronology failed: execution snapshot capture time is missing.");
        }

        if (verificationSnapshot.Header.CapturedUtc is null)
        {
            failures.Add("Verification chronology failed: verification snapshot capture time is missing.");
        }
        else if (executionCapturedUtc is DateTime executionCaptured
                 && verificationSnapshot.Header.CapturedUtc <= executionCaptured)
        {
            failures.Add("Verification chronology failed: verification snapshot must be captured strictly later than the execution snapshot.");
        }

        if (changeImplementedUtc is DateTime attestedUtc
            && verificationSnapshot.Header.CapturedUtc is DateTime verificationCaptured
            && verificationCaptured <= attestedUtc)
        {
            failures.Add("Verification chronology failed: verification snapshot must be captured strictly later than the change implementation attestation.");
        }

        if (verificationSnapshot.Header.CaptureStatus != AzureInventoryCaptureStatus.Succeeded)
        {
            failures.Add(
                $"Verification capture status failed: verification snapshot capture status is {verificationSnapshot.Header.CaptureStatus}, not Succeeded.");
        }

        if (failures.Count > 0)
        {
            return Failed(instance, failures);
        }

        if (instance.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
        {
            AzureInventoryResourceRecord? resource = verificationSnapshot.Resources
                .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

            if (resource is null)
                failures.Add("Target cloud resource is not present in the verification snapshot.");
        }

        HashSet<string> evaluatedQueries = new(StringComparer.OrdinalIgnoreCase);
        bool substantivePostconditionPassed = false;

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
            else if (IsSubstantiveQuery(query))
            {
                substantivePostconditionPassed = true;
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
                else if (IsSubstantiveQuery(query))
                {
                    substantivePostconditionPassed = true;
                }
            }
        }

        if (!substantivePostconditionPassed)
        {
            failures.Add("Verification requires at least one substantive postcondition to pass.");
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
                executionCapturedUtc,
                changeImplementedUtc,
                verificationCapturedUtc = verificationSnapshot.Header.CapturedUtc,
                verificationCaptureStatus = verificationSnapshot.Header.CaptureStatus,
            }),
        };
    }

    private static bool IsSubstantiveQuery(string query) =>
        query.Trim().StartsWith("property:", StringComparison.OrdinalIgnoreCase)
        || query.Trim().StartsWith("path:hash-absent=", StringComparison.OrdinalIgnoreCase);

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

        if (!pathVerificationContext.PathAnalysisCompleted)
        {
            failure = $"Verification query '{query}' failed — path analysis did not complete for the verification snapshot.";
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
