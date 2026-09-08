using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Operator-facing nouns for held-check codes (DX-52).</summary>
public static class HeldCheckInputCodeLabels
{
    public static string ToOperatorLabel(HeldCheckInputCode inputCode)
    {
        return inputCode switch
        {
            HeldCheckInputCode.AzureInventoryZip => "Azure inventory ZIP",
            HeldCheckInputCode.AwsInventoryZip => "AWS inventory ZIP",
            HeldCheckInputCode.GcpInventoryZip => "GCP inventory ZIP",
            HeldCheckInputCode.ActorNodes => "Actor nodes",
            HeldCheckInputCode.RbacBindings => "RBAC / IAM bindings",
            HeldCheckInputCode.SecretRotationMetadata => "secret rotation metadata",
            HeldCheckInputCode.ReplicaOrFailoverProperties => "replica or failover properties",
            HeldCheckInputCode.NetworkPolicyRules => "NSG / NetworkPolicy rules",
            HeldCheckInputCode.PriorRunSnapshot => "prior-run snapshot",
            HeldCheckInputCode.AssignedPolicyPack => "assigned policy pack",
            _ => throw new ArgumentOutOfRangeException(nameof(inputCode), inputCode, "Unhandled held-check input code."),
        };
    }

    public static string FormatUnblockClause(HeldCheckLedgerRollupEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        string label = ToOperatorLabel(entry.InputCode);
        int count = entry.EngineCount;

        return count == 1
            ? $"Uploading {label} would unblock 1 engine."
            : $"Uploading {label} would unblock {count} engines.";
    }
}
