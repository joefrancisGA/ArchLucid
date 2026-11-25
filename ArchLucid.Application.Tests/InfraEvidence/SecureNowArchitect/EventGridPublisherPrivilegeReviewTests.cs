using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
public sealed class EventGridPublisherPrivilegeReviewTests
{
    [Theory]
    [InlineData("EventGrid Data Sender", "/subscriptions/sub", "Microsoft.EventGrid/topics", false, "broad-publisher-scope-review")]
    [InlineData("EventGrid Data Sender", "/subscriptions/sub/resourceGroups/rg", "Microsoft.EventGrid/topics", false, "broad-publisher-scope-review")]
    [InlineData("EventGrid Data Sender", "/providers/Microsoft.Management/managementGroups/mg", null, false, "broad-publisher-scope-review")]
    [InlineData("EventGrid Data Sender", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic", "Microsoft.EventGrid/topics", false, "publisher-intent-unverified")]
    [InlineData("Owner", "/subscriptions/sub", "Microsoft.EventGrid/domains", false, "management-role-publisher-review")]
    [InlineData("EventGrid Contributor", "/subscriptions/sub", "Microsoft.EventGrid/topics", false, "management-role-publisher-review")]
    [InlineData("Owner", "/subscriptions/sub", "Microsoft.Storage/storageAccounts", false, null)]
    [InlineData("EventGrid Data Sender", "/subscriptions/sub", "Microsoft.EventGrid/topics", true, null)]
    [InlineData("EventGrid EventSubscription Contributor", "/subscriptions/sub", "Microsoft.EventGrid/topics", false, null)]
    public void Evaluate_classifies_review_without_claiming_intent(
        string role, string scope, string? resourceType, bool insufficient, string? expected)
    {
        PrivilegePathCandidate candidate = new()
        {
            EffectiveRoleName = role,
            TerminalResourceType = resourceType,
            HasInsufficientEvidenceHop = insufficient,
            Hops =
            [
                new PrivilegePathEdge
                {
                    EdgeType = GraphEdgeTypes.HasRole,
                    ToNodeId = scope,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new PrivilegePathEdge
                {
                    EdgeType = GraphEdgeTypes.CanWrite,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
            ],
        };

        Assert.Equal(expected, EventGridPublisherPrivilegeReview.Evaluate(candidate));
    }
}
