using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>**TB-993:** integration-event outbox producers must set stable <c>MessageId</c> values.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventOutboxMessageIdArchitectureTests
{
    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    private static readonly (string RelativePath, string StableIdMarker)[] OutboxProducerAnchors =
    [
        ("ArchLucid.Core/Persistence/ApplicationPorts/IntegrationOutbox/OutboxAwareIntegrationEventPublishing.cs",
            "LogWarningIntegrationEventOutboxMissingMessageId"),
        ("ArchLucid.Application/Runs/Orchestration/AuthorityCommittedPipelineFinalizer.cs",
            "BuildAuthorityRunCompletedMessageId"),
        ("ArchLucid.Application/Governance/GovernanceWorkflowService.cs", "messageId = $"),
        ("ArchLucid.Persistence/Alerts/AlertIntegrationEventPublishing.cs", "messageId = $"),
        ("ArchLucid.Application/Advisory/AdvisoryScanRunner.cs", "messageId = $"),
        ("ArchLucid.Application/Billing/MarketplaceWebhookIntegrationEventPublisher.cs", "messageId = $"),
        ("ArchLucid.Application/Notifications/Email/TrialLifecycleIntegrationEventPublisher.cs",
            "ArgumentException.ThrowIfNullOrWhiteSpace(messageId)"),
        ("ArchLucid.Application/DataConsistency/DataConsistencyReconciliationHostedService.cs", "string messageId ="),
        ("ArchLucid.Application/Runs/Finalization/ManifestFinalizationService.cs", "OutboxMessageId = messageId"),
    ];

    [Fact]
    public void Outbox_producers_define_stable_message_id_anchors()
    {
        string root = FindRepoRoot();

        foreach ((string relativePath, string marker) in OutboxProducerAnchors)
        {
            string path = Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar));
            File.Exists(path).Should().BeTrue($"expected producer anchor file {relativePath}");
            string text = File.ReadAllText(path);
            text.Should().Contain(marker, $"producer {relativePath} must keep stable MessageId construction ({marker})");
        }
    }
}
