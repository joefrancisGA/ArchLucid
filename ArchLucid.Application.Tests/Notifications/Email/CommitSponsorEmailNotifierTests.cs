using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommitSponsorEmailNotifierTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid RunId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid ArchitectureId = Guid.Parse("22222222-3333-4444-5555-666666666666");
    private static readonly string RunIdText = RunId.ToString("D");

    [SkippableFact]
    public async Task NotifyAfterCommitAsync_when_admin_email_missing_does_not_send()
    {
        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup
            .Setup(x => x.TryResolveAdminEmailAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        Mock<IEmailProvider> email = new();
        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(
            new EmailNotificationOptions { ProductDisplayName = "Prod", OperatorBaseUrl = "https://app.example" });

        CommitSponsorEmailNotifier sut = CreateSut(lookup.Object, email.Object, options);

        await sut.NotifyAfterCommitAsync(TenantId, RunIdText, CancellationToken.None);

        email.Verify(
            x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task NotifyAfterCommitAsync_when_admin_email_resolved_sends_with_peer_review_link()
    {
        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup
            .Setup(x => x.TryResolveAdminEmailAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("sponsor@example.com");

        Mock<IEmailProvider> email = new();
        email.Setup(x => x.ProviderName).Returns("test");

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(
            new EmailNotificationOptions { ProductDisplayName = "Prod", OperatorBaseUrl = "https://app.example" });

        CommitSponsorEmailNotifier sut = CreateSut(lookup.Object, email.Object, options);

        await sut.NotifyAfterCommitAsync(TenantId, RunIdText, CancellationToken.None);

        email.Verify(
            x => x.SendAsync(
                It.Is<EmailMessage>(m =>
                    m.To == "sponsor@example.com"
                    && m.Subject.Contains("Prod", StringComparison.Ordinal)
                    && m.HtmlBody.Contains(RunIdText, StringComparison.Ordinal)
                    && m.HtmlBody.Contains("https://app.example/architecture/reviews/", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task NotifyAfterCommitAsync_when_architecture_linked_sends_nested_review_link()
    {
        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup
            .Setup(x => x.TryResolveAdminEmailAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("sponsor@example.com");

        Mock<IEmailProvider> email = new();
        email.Setup(x => x.ProviderName).Returns("test");

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(
            new EmailNotificationOptions { ProductDisplayName = "Prod", OperatorBaseUrl = "https://app.example" });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunId, ArchitectureId = ArchitectureId });

        CommitSponsorEmailNotifier sut = CreateSut(lookup.Object, email.Object, options, runs.Object);

        await sut.NotifyAfterCommitAsync(TenantId, RunIdText, CancellationToken.None);

        string expectedPath =
            $"/architecture/architectures/{ArchitectureId:D}/reviews/{RunIdText}";

        email.Verify(
            x => x.SendAsync(
                It.Is<EmailMessage>(m =>
                    m.HtmlBody.Contains($"https://app.example{expectedPath}", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task NotifyAfterCommitAsync_when_send_fails_does_not_throw()
    {
        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup
            .Setup(x => x.TryResolveAdminEmailAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("sponsor@example.com");

        Mock<IEmailProvider> email = new();
        email.Setup(x => x.ProviderName).Returns("test");
        email
            .Setup(x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("smtp down"));

        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(new EmailNotificationOptions());

        CommitSponsorEmailNotifier sut = CreateSut(lookup.Object, email.Object, options);

        Func<Task> act = async () => await sut.NotifyAfterCommitAsync(TenantId, RunIdText, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [SkippableFact]
    public async Task NotifyAfterCommitAsync_when_admin_mailbox_malformed_does_not_send()
    {
        Mock<ITenantTrialEmailContactLookup> lookup = new();
        lookup
            .Setup(x => x.TryResolveAdminEmailAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("finance@");

        Mock<IEmailProvider> email = new();
        IOptionsMonitor<EmailNotificationOptions> options = BuildOptions(
            new EmailNotificationOptions { ProductDisplayName = "Prod", OperatorBaseUrl = "https://app.example" });

        CommitSponsorEmailNotifier sut = CreateSut(lookup.Object, email.Object, options);

        await sut.NotifyAfterCommitAsync(TenantId, RunIdText, CancellationToken.None);

        email.Verify(
            x => x.SendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static CommitSponsorEmailNotifier CreateSut(
        ITenantTrialEmailContactLookup lookup,
        IEmailProvider email,
        IOptionsMonitor<EmailNotificationOptions> options,
        IRunRepository? runRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        return new CommitSponsorEmailNotifier(
            lookup,
            email,
            options,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            runRepository ?? Mock.Of<IRunRepository>(),
            scope.Object,
            NullLogger<CommitSponsorEmailNotifier>.Instance);
    }

    private static IOptionsMonitor<EmailNotificationOptions> BuildOptions(EmailNotificationOptions value)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> mock = new();
        mock.Setup(x => x.CurrentValue).Returns(value);

        return mock.Object;
    }
}
