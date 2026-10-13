using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.ExecDigest;

[Trait("Suite", "Core")]
public sealed class ExecDigestSponsorDeepLinkReadServiceSignInUrlTests
{
    [Fact]
    public async Task TryLoadViewAsync_omits_user_info_from_sign_in_url_on_dashboard_view()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ExecDigestSponsorDeepLinkClaims parsedClaims = new(
            ExecDigestSponsorDeepLinkTarget.Dashboard,
            tenantId,
            "2026-W15",
            null);
        Mock<IExecDigestSponsorDeepLinkTokenFactory> tokenFactory = new(MockBehavior.Strict);
        tokenFactory
            .Setup(factory => factory.TryParse("dashboard-token", out parsedClaims))
            .Returns(true);

        Mock<ITenantRepository> tenantRepository = new(MockBehavior.Strict);
        tenantRepository
            .Setup(repo => repo.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                DefaultProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

        Mock<IExecDigestComposer> composer = new(MockBehavior.Strict);
        composer
            .Setup(c => c.ComposeAsync(
                tenantId,
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestComposition(
                "week",
                null,
                null,
                [],
                null,
                "https://ops.example.test/runs",
                "https://ops.example.test/sponsor",
                null,
                null,
                null,
                null));

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Loose);
        Mock<IManifestHashService> manifestHash = new(MockBehavior.Loose);
        Mock<IRunDetailQueryService> runDetail = new(MockBehavior.Strict);
        Mock<IRunSummaryOnePagerExportService> export = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<EmailNotificationOptions>> emailOptions = new(MockBehavior.Strict);
        emailOptions
            .Setup(monitor => monitor.CurrentValue)
            .Returns(new EmailNotificationOptions
            {
                OperatorBaseUrl = "https://user:secret@ops.example.test",
            });

        ExecDigestSponsorDeepLinkReadService sut = new(
            tokenFactory.Object,
            tenantRepository.Object,
            composer.Object,
            runDetail.Object,
            export.Object,
            authority.Object,
            manifestHash.Object,
            emailOptions.Object);

        ExecDigestSponsorDeepLinkViewResponse? view =
            await sut.TryLoadViewAsync("dashboard-token", null, CancellationToken.None);

        view.Should().NotBeNull();
        view!.SignInUrl.Should().Be("https://ops.example.test/auth/sign-in");
    }
}
