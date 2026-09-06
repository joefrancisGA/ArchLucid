using ArchLucid.Contracts.Requests;

using FluentAssertions;

using ArchLucid.Core.Requests;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintClassifierTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_constraint_mentions_managed_identity()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_is_case_insensitive()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Managed Identity"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_unmanaged_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["unmanaged identity for storage"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_non_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["non-managed identity acceptable"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_detects_private_endpoint_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["traffic via private endpoint only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_detects_private_networking_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["require private networking"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_matches_generic_private_word()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["everything must remain private"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_true_when_encryption_is_mentioned()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["encryption at rest required"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresSearchCapability_returns_true_when_search_is_required()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["Hybrid search"]);

        RequestConstraintClassifier.RequiresSearchCapability(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresAiCapability_returns_true_for_openai_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["calls Azure OpenAI"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresAiCapability_returns_true_for_generic_ai_capability()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["embedding models via ai"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresSqlCapability_returns_true_when_sql_capability_is_required()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["relational store (sql)"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_nosql_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["NoSQL document store"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_mysql_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["MySQL database"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_non_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["non-encryption allowed"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_non_encryption_underscore_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["non_encryption required"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresAiCapability_does_not_false_positive_on_email_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["email notifications"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSearchCapability_does_not_false_positive_on_research_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["market research"]);

        RequestConstraintClassifier.RequiresSearchCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_does_not_false_positive_on_non_private_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["non-private networking allowed"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_does_not_false_positive_on_non_private_space_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["non private networking allowed"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_no_sql_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["no-sql datastore"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_not_sql_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["not sql datastore"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_no_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["no-encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_not_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["not encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_without_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["without encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_without_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["without managed identity for storage"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_does_not_false_positive_on_without_private_networking_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["without private networking for batch workloads"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_must_not_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["must not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_do_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workflows do not require encryption"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_avoid_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["avoid encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_not_required_to_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["not required to use managed identity"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_avoid_sql_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["avoid sql databases"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_not_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["not managed identity for storage"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_not_necessary_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["encryption not necessary for this workload"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_no_need_to_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["no need to use managed identity for storage"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_isnt_required_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["encryption isn't required for this workload"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_doesnt_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["doesn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_is_unnecessary_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["encryption is unnecessary for dev"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_need_not_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["managed identity need not be used for storage"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_does_not_false_positive_on_need_not_private_networking_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["private networking need not be required for batch workloads"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["encryption need not be used at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_does_not_false_positive_on_cannot_use_managed_identity_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["cannot use managed identity for storage"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_require_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_is_not_required_to_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["is not required to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_is_not_needed_for_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["is not needed for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_is_not_necessary_for_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["is not necessary for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cannot_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shouldnt_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shouldn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wont_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads won't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cannot_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cannot_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cannot_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cannot_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cannot_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cannot_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads cannot have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_maintain_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_mandate_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_ensure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_provision_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_apply_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_configure_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_enforce_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_does_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads does not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_will_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_will_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_will_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_will_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_will_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_will_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads will not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_would_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_would_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_would_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_would_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_would_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_would_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads would not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shall_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shall_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shall_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shall_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shall_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shall_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shall not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_ought_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_ought_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_ought_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_ought_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_ought_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_ought_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ought not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_should_not_implement_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_should_not_enable_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_should_not_deploy_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_should_not_adopt_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_should_not_use_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_should_not_have_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads should not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_need_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads need not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_need_not_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["need not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_require_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_doesnt_need_encryption_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads doesn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shall_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shall not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_would_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["would not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_should_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["should not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_will_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["will not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_ought_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ought not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresAiCapability_does_not_false_positive_on_no_ai_capability_phrasing()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["no-ai inference"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeFalse();
    }

    [Fact]
    public void All_members_throw_when_request_is_null()
    {
        Action act1 = () => RequestConstraintClassifier.HasManagedIdentityConstraint(null!);

        Action act2 = () => RequestConstraintClassifier.HasPrivateNetworkingConstraint(null!);

        Action act3 = () => RequestConstraintClassifier.HasEncryptionConstraint(null!);

        Action act4 = () => RequestConstraintClassifier.RequiresSearchCapability(null!);

        Action act5 = () => RequestConstraintClassifier.RequiresAiCapability(null!);

        Action act6 = () => RequestConstraintClassifier.RequiresSqlCapability(null!);

        act1.Should().ThrowExactly<ArgumentNullException>().Which.ParamName.Should().Be("request");

        act2.Should().ThrowExactly<ArgumentNullException>().Which.ParamName.Should().Be("request");

        act3.Should().ThrowExactly<ArgumentNullException>().Which.ParamName.Should().Be("request");

        act4.Should().ThrowExactly<ArgumentNullException>().Which.ParamName.Should().Be("request");

        act5.Should().ThrowExactly<ArgumentNullException>().Which.ParamName.Should().Be("request");

        act6.Should().ThrowExactly<ArgumentNullException>().Which.ParamName.Should().Be("request");
    }

    private static ArchitectureRequest CreateRequest(List<string>? constraints = null,
        List<string>? capabilities = null)
    {
        return new ArchitectureRequest
        {
            Description = "architecture request for tests",
            SystemName = "TestSystem",
            Environment = "dev",
            Constraints = constraints ?? [],
            RequiredCapabilities = capabilities ?? [],
        };
    }
}
