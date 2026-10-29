using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DeclarationInventoryContradictionThreeWayGateTests
{
    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_declaration_disables_public_access()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.public_network_access",
            "Disabled",
            "Enabled",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_declaration_enables_public_access()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.public_network_access",
            "Enabled",
            "Disabled",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_declaration_enables_https_only()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.https_only",
            "true",
            "false",
            "Azure",
            "transport-security");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_declaration_enables_storage_encryption()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "rds",
            "arn:aws:rds:us-east-1:123456789012:db:pay-db",
            "tf.storage_encrypted",
            "true",
            "false",
            "Aws",
            "encryption");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_network_acl_blob_defaults_to_deny()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.networkacls",
            """{"defaultaction":"deny"}""",
            "Allow",
            "Azure",
            "network-isolation");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_k8s_privileged_is_false()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "payment-api",
            "apps/v1/namespaces/default/deployments/payment-api",
            "k8s.privileged",
            "false",
            "true",
            "Azure",
            "workload-isolation");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_public_token_is_embedded_inside_republic_key_segment()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.corporateRepublicNetworkAccess",
            "false",
            "true",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_camel_case_public_segment_disables_access()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.allowPublicNetworkAccess",
            "Disabled",
            "Enabled",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_tls_token_is_embedded_inside_unrelated_key_segment()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.netlsPipeline",
            "true",
            "false",
            "Azure",
            "transport-security");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_https_token_is_embedded_inside_unrelated_key_segment()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.rehttpsRedirect",
            "true",
            "false",
            "Azure",
            "transport-security");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_storageencrypted_token_is_embedded_inside_unrelated_key_segment()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "rds",
            "arn:aws:rds:us-east-1:123456789012:db:pay-db",
            "tf.restorageencryptedFlag",
            "true",
            "false",
            "Aws",
            "encryption");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_defaultaction_token_is_embedded_inside_unrelated_key_segment()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.antidefaultactionPolicy",
            """{"defaultaction":"deny"}""",
            "Allow",
            "Azure",
            "network-isolation");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_privileged_token_is_embedded_inside_unrelated_key_segment()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "payment-api",
            "apps/v1/namespaces/default/deployments/payment-api",
            "k8s.unprivilegedContainer",
            "false",
            "true",
            "Azure",
            "workload-isolation");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_for_unknown_declaration_key()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.custom_flag",
            "true",
            "false",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_DeclarationClaimsSecureControl_returns_true_when_declaration_requires_tls_1_2()
    {
        DeclarationInventoryContradictionMismatch dotted = new(
            "app-1",
            "app-pay",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-pay",
            "tf.min_tls_version",
            "1.2",
            "1.0",
            "Azure",
            "transport-security");

        DeclarationInventoryContradictionMismatch armLiteral = new(
            "storage-1",
            "stpayprod",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
            "tf.minimum_tls_version",
            "TLS1_2",
            "TLS1_0",
            "Azure",
            "transport-security");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(dotted).Should().BeTrue();
        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(armLiteral).Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_DeclarationClaimsSecureControl_returns_false_when_declaration_allows_tls_1_0()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "app-1",
            "app-pay",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-pay",
            "tf.min_tls_version",
            "1.0",
            "1.2",
            "Azure",
            "transport-security");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }
}
