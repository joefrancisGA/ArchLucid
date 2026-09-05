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
        Guid executionSnapshotId)
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

        foreach (string query in content.Execution?.VerificationQueries ?? [])
        {
            if (!EvaluateQuery(query, verificationSnapshot, instance.CloudResourceId, out string? failure))
                failures.Add(failure ?? $"Verification query failed: {query}");
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
        out string? failure)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            failure = null;
            return true;
        }

        string trimmed = query.Trim();

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
