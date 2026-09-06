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
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shouldnt_curly_apostrophe_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shouldn\u2019t have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_wont_curly_apostrophe_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["won\u2019t enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_doesnt_curly_apostrophe_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["doesn\u2019t implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_does_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["does not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_wont_curly_apostrophe_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["won\u2019t have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cant_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["can't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cant_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["can't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cant_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["can't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_cant_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["can't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mustnt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mustn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mustnt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mustn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mustnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mustn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mustnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mustn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cant_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads can't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_cant_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads can't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_mustnt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads mustn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_mustnt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads mustn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_neednt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["needn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_neednt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["needn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_neednt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["needn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_neednt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["needn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_couldnt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["couldn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_couldnt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["couldn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_couldnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["couldn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_couldnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["couldn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_couldnt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads couldn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_couldnt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads couldn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_neednt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads needn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_neednt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads needn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mightnt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mightn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mightnt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mightn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mightnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mightn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_mightnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mightn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shant_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shan't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shant_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shan't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shant_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shan't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_shant_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["shan't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_mightnt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads mightn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_mightnt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads mightn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shant_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shan't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_shant_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads shan't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_aint_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ain't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_aint_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ain't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_aint_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ain't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_aint_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["ain't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_darent_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["daren't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_darent_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["daren't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_aint_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ain't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_aint_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads ain't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_darent_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads daren't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_darent_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads daren't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_maynt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mayn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_maynt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["mayn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_maynt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads mayn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_maynt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads mayn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_oughtnt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["oughtn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_oughtnt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["oughtn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_oughtnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads oughtn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_oughtnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads oughtn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_didnt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["didn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_didnt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["didn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_didnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads didn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_didnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads didn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_didnt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams didn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_wasnt_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["wasn't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_wasnt_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["wasn't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wasnt_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads wasn't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_workloads_wasnt_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["workloads wasn't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wasnt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams wasn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cant_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_aint_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ain't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_darent_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams daren't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_maynt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mayn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_oughtnt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams oughtn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mightnt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mightn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_enable_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't enable encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_implement_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't implement encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_deploy_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't deploy encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_adopt_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't adopt encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_can_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams can not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_require_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't require encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_need_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't need encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_have_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't have encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_configure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't configure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_mandate_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't mandate encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_apply_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't apply encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_enforce_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't enforce encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_maintain_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't maintain encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_ensure_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't ensure encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_provision_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't provision encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_no_requirement_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams no requirement to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_not_required_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams not required to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_necessary_for_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not necessary for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_no_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams no need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_for_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_no_need_for_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams no need for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_not_needed_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams not needed to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_for_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_not_necessary_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams not necessary to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_not_required_for_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams not required for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_necessary_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not necessary to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_not_necessary_for_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams not necessary for encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_wont_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams won't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shouldnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shouldn't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_cannot_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams cannot need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_ought_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams ought not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_should_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams should not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shall_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shall not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_will_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams will not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_would_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams would not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_need_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams need not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_could_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams could not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_couldnt_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams couldn't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_neednt_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams needn't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_doesnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams doesn't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_dont_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams don't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_do_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams do not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_does_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams does not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_must_not_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams must not need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_required_to_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not required to need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_mustnt_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams mustn't need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to enforce to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_provision_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to provision to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_maintain_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to maintain to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_ensure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to ensure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_require_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to require to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_is_not_needed_to_need_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams is not needed to need to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_configure_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't configure to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_mandate_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't mandate to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_apply_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't apply to use encryption at rest"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_teams_shant_enforce_to_use_encryption_at_rest_phrasing()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["teams shan't enforce to use encryption at rest"]);

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
