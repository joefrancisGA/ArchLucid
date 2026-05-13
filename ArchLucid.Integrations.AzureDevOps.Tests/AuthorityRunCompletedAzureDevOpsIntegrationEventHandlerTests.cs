using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Integration;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

public sealed class AuthorityRunCompletedAzureDevOpsIntegrationEventHandlerTests
{
    private static AuthorityRunCompletedAzureDevOpsIntegrationEventHandler CreateSut(
        Mock<IAzureDevOpsPullRequestDecorator> decorator,
        AzureDevOpsIntegrationOptions options)
    {
        return new AuthorityRunCompletedAzureDevOpsIntegrationEventHandler(
            decorator.Object,
            Options.Create(options),
            NullLogger<AuthorityRunCompletedAzureDevOpsIntegrationEventHandler>.Instance);
    }

    private static AzureDevOpsIntegrationOptions OptionsForHandle()
    {
        return new AzureDevOpsIntegrationOptions
        {
            Enabled = true,
            RepositoryId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            PullRequestId = 402,
        };
    }

    [Fact]
    public void EventType_is_authority_run_completed_v1()
    {
        Mock<IAzureDevOpsPullRequestDecorator> deco = new();
        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut = CreateSut(deco, new AzureDevOpsIntegrationOptions());

        Assert.Equal(IntegrationEventTypes.AuthorityRunCompletedV1, sut.EventType);
    }

    [Fact]
    public async Task HandleAsync_no_ops_when_integration_disabled()
    {
        Mock<IAzureDevOpsPullRequestDecorator> deco = new();
        AzureDevOpsIntegrationOptions options = OptionsForHandle();
        options.Enabled = false;
        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut = CreateSut(deco, options);

        byte[] utf8Payload = "{\"SchemaVersion\":1}"u8.ToArray();
        await sut.HandleAsync(utf8Payload, CancellationToken.None);

        deco.Verify(
            d => d.PostManifestDeltaAsync(
                It.IsAny<AzureDevOpsManifestDeltaRequest>(),
                It.IsAny<AzureDevOpsPullRequestTarget>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        deco.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandleAsync_no_ops_when_repository_or_pull_request_missing()
    {
        Mock<IAzureDevOpsPullRequestDecorator> deco = new();
        AzureDevOpsIntegrationOptions options = OptionsForHandle();
        options.RepositoryId = Guid.Empty;
        options.PullRequestId = 42;
        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut = CreateSut(deco, options);

        await sut.HandleAsync("{\"SchemaVersion\":1}"u8.ToArray(), CancellationToken.None);

        deco.VerifyNoOtherCalls();

        options.RepositoryId = Guid.NewGuid();
        options.PullRequestId = 0;
        deco.Reset();

        await sut.HandleAsync("{\"SchemaVersion\":1}"u8.ToArray(), CancellationToken.None);

        deco.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandleAsync_wraps_bad_json_as_FormatException()
    {
        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut =
            CreateSut(new Mock<IAzureDevOpsPullRequestDecorator>(), OptionsForHandle());

        FormatException ex =
            await Assert.ThrowsAsync<FormatException>(() =>
                sut.HandleAsync("{ not json"u8.ToArray(), CancellationToken.None));

        Assert.StartsWith("Authority run completed payload was not valid JSON.", ex.Message);
        Assert.IsType<JsonException>(ex.InnerException);
    }

    [Fact]
    public async Task HandleAsync_throws_when_json_is_null_literal()
    {
        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut =
            CreateSut(new Mock<IAzureDevOpsPullRequestDecorator>(), OptionsForHandle());

        FormatException ex = await Assert.ThrowsAsync<FormatException>(() => sut.HandleAsync("null"u8.ToArray(), CancellationToken.None));
        Assert.Equal("Authority run completed payload deserialized to null.", ex.Message);
    }

    [Fact]
    public async Task HandleAsync_posts_trimmed_manifest_delta_mapped_findings()
    {
        Mock<IAzureDevOpsPullRequestDecorator> deco = new();
        deco.Setup(d => d.PostManifestDeltaAsync(It.IsAny<AzureDevOpsManifestDeltaRequest>(),
                It.IsAny<AzureDevOpsPullRequestTarget>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut = CreateSut(deco, OptionsForHandle());

        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid manifestId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid? previous = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        object?[] findingsForJson =
        [
            new
            {
                findingId = "  fid  ",
                deepLinkUrl = " https://inspect ",
                severity = "",
            },
            new { findingId = "", deepLinkUrl = "https://broken", severity = "High" },
            new { findingId = "ok", deepLinkUrl = "", severity = (string?)null },
            null,
        ];

        object envelope = new
        {
            schemaVersion = 1,
            runId,
            manifestId,
            tenantId,
            workspaceId,
            projectId,
            previousRunId = previous,
            findings = findingsForJson,
        };

        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(envelope));
        await sut.HandleAsync(utf8, CancellationToken.None);

        deco.Verify(
            d => d.PostManifestDeltaAsync(
                    It.Is<AzureDevOpsManifestDeltaRequest>(
                        r => r.RunId == runId
                             && r.ManifestId == manifestId
                             && r.TenantId == tenantId
                             && r.WorkspaceId == workspaceId
                             && r.ProjectId == projectId
                             && r.PreviousRunId == previous
                             && r.Findings.Count == 1
                             && r.Findings[0].FindingId == "fid"
                             && r.Findings[0].DeepLinkUrl == "https://inspect"
                             && r.Findings[0].Severity == null),
                    It.Is<AzureDevOpsPullRequestTarget>(
                        t => t.RepositoryId == Guid.Parse("11111111-1111-1111-1111-111111111111")
                             && t.PullRequestId == 402),
                    It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAsync_posts_when_findings_omitted()
    {
        Mock<IAzureDevOpsPullRequestDecorator> deco = new();
        deco.Setup(d => d.PostManifestDeltaAsync(It.IsAny<AzureDevOpsManifestDeltaRequest>(),
                It.IsAny<AzureDevOpsPullRequestTarget>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut = CreateSut(deco, OptionsForHandle());

        object envelope = new
        {
            schemaVersion = 1,
            runId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            manifestId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            previousRunId = (Guid?)null,
            findings = (object?)null
        };

        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(envelope));
        await sut.HandleAsync(utf8, CancellationToken.None);

        deco.Verify(
            d => d.PostManifestDeltaAsync(
                    It.Is<AzureDevOpsManifestDeltaRequest>(r => r.Findings.Count == 0 && r.PreviousRunId == null),
                    It.IsAny<AzureDevOpsPullRequestTarget>(),
                    It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAsync_keeps_explicit_severity_when_present()
    {
        Mock<IAzureDevOpsPullRequestDecorator> deco = new();
        deco.Setup(d => d.PostManifestDeltaAsync(It.IsAny<AzureDevOpsManifestDeltaRequest>(),
                It.IsAny<AzureDevOpsPullRequestTarget>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityRunCompletedAzureDevOpsIntegrationEventHandler sut = CreateSut(deco, OptionsForHandle());

        object envelope = new
        {
            schemaVersion = 1,
            runId = Guid.NewGuid(),
            manifestId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            findings = new[] { new { findingId = "a", deepLinkUrl = "https://x", severity = "  Critical " }, },
        };

        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(envelope));
        await sut.HandleAsync(utf8, CancellationToken.None);

        deco.Verify(d => d.PostManifestDeltaAsync(
                It.Is<AzureDevOpsManifestDeltaRequest>(
                    r => r.Findings.Count == 1 && r.Findings[0].Severity == "Critical"),
                It.IsAny<AzureDevOpsPullRequestTarget>(),
                It.IsAny<CancellationToken>()), Times.Once);
    }
}
