using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApprovalSlaMonitorTests
{
    private readonly InMemoryGovernanceApprovalRequestRepository _approvalRepo = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IHttpClientFactory> _httpClientFactory = new();
    private readonly ILogger<ApprovalSlaMonitor> _logger = NullLogger<ApprovalSlaMonitor>.Instance;

    private ApprovalSlaMonitor CreateSut(PreCommitGovernanceGateOptions? options = null)
    {
        PreCommitGovernanceGateOptions opts = options ?? new PreCommitGovernanceGateOptions { ApprovalSlaHours = 24, };

        return new ApprovalSlaMonitor(
            _approvalRepo,
            _auditService.Object,
            Options.Create(opts),
            _httpClientFactory.Object,
            _logger);
    }

    [SkippableFact]
    public async Task CheckAndEscalateAsync_emits_audit_for_breached_request()
    {
        GovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "user-a",
            RequestedUtc = TimeProvider.System.UtcNowDateTime().AddHours(-48),
            SlaDeadlineUtc = TimeProvider.System.UtcNowDateTime().AddHours(-24),
        };
        await _approvalRepo.CreateAsync(request, CancellationToken.None);

        ApprovalSlaMonitor sut = CreateSut();
        await sut.CheckAndEscalateAsync(CancellationToken.None);

        _auditService.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernanceApprovalSlaBreached),
                It.IsAny<CancellationToken>()),
            Times.Once);

        GovernanceApprovalRequest? updated = await _approvalRepo.GetByIdAsync(request.ApprovalRequestId, CancellationToken.None);
        updated!.SlaBreachNotifiedUtc.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task CheckAndEscalateAsync_skips_request_before_deadline()
    {
        GovernanceApprovalRequest request = new()
        {
            RunId = "run-2",
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "user-b",
            RequestedUtc = TimeProvider.System.UtcNowDateTime(),
            SlaDeadlineUtc = TimeProvider.System.UtcNowDateTime().AddHours(24),
        };
        await _approvalRepo.CreateAsync(request, CancellationToken.None);

        ApprovalSlaMonitor sut = CreateSut();
        await sut.CheckAndEscalateAsync(CancellationToken.None);

        _auditService.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task CheckAndEscalateAsync_does_not_repeat_for_already_notified_request()
    {
        GovernanceApprovalRequest request = new()
        {
            RunId = "run-3",
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "user-c",
            RequestedUtc = TimeProvider.System.UtcNowDateTime().AddHours(-48),
            SlaDeadlineUtc = TimeProvider.System.UtcNowDateTime().AddHours(-24),
            SlaBreachNotifiedUtc = TimeProvider.System.UtcNowDateTime().AddHours(-12),
        };
        await _approvalRepo.CreateAsync(request, CancellationToken.None);

        ApprovalSlaMonitor sut = CreateSut();
        await sut.CheckAndEscalateAsync(CancellationToken.None);

        _auditService.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task CheckAndEscalateAsync_emits_audit_but_no_http_when_no_webhook_url()
    {
        GovernanceApprovalRequest request = new()
        {
            RunId = "run-4",
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "user-d",
            RequestedUtc = TimeProvider.System.UtcNowDateTime().AddHours(-48),
            SlaDeadlineUtc = TimeProvider.System.UtcNowDateTime().AddHours(-24),
        };
        await _approvalRepo.CreateAsync(request, CancellationToken.None);

        PreCommitGovernanceGateOptions opts = new() { ApprovalSlaHours = 24, ApprovalSlaEscalationWebhookUrl = null, };

        ApprovalSlaMonitor sut = CreateSut(opts);
        await sut.CheckAndEscalateAsync(CancellationToken.None);

        _auditService.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernanceApprovalSlaBreached),
                It.IsAny<CancellationToken>()),
            Times.Once);

        _httpClientFactory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [SkippableFact]
    public async Task CheckAndEscalateAsync_does_nothing_when_sla_not_configured()
    {
        GovernanceApprovalRequest request = new()
        {
            RunId = "run-5",
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "user-e",
            RequestedUtc = TimeProvider.System.UtcNowDateTime().AddHours(-48),
            SlaDeadlineUtc = TimeProvider.System.UtcNowDateTime().AddHours(-24),
        };
        await _approvalRepo.CreateAsync(request, CancellationToken.None);

        PreCommitGovernanceGateOptions opts = new() { ApprovalSlaHours = null, };

        ApprovalSlaMonitor sut = CreateSut(opts);
        await sut.CheckAndEscalateAsync(CancellationToken.None);

        _auditService.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
    private sealed class StubWebhookHandler(Func<HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(responseFactory());
        }
    }

    private async Task<GovernanceApprovalRequest> CreateBreachedRequestAsync()
    {
        GovernanceApprovalRequest request = new()
        {
            RunId = "webhook-test-run",
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "prod",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "webhook-tester",
            RequestedUtc = TimeProvider.System.UtcNowDateTime().AddHours(-48),
            SlaDeadlineUtc = TimeProvider.System.UtcNowDateTime().AddHours(-24),
        };
        await _approvalRepo.CreateAsync(request, CancellationToken.None);
        return request;
    }

    private ApprovalSlaMonitor CreateWebhookSut(HttpClient client)
    {
        _httpClientFactory.Setup(f => f.CreateClient(ApprovalSlaMonitor.SlaEscalationHttpClientName))
            .Returns(client);
        return CreateSut(new PreCommitGovernanceGateOptions
        {
            ApprovalSlaHours = 24,
            ApprovalSlaEscalationWebhookUrl = "https://example.test/governance/sla"
        });
    }

    [Fact]
    public async Task SuccessfulWebhook_MarksNotifiedAndDoesNotSendAgain()
    {
        GovernanceApprovalRequest request = await CreateBreachedRequestAsync();
        StubWebhookHandler handler = new(() => new HttpResponseMessage(System.Net.HttpStatusCode.OK));
        using HttpClient client = new(handler);
        ApprovalSlaMonitor sut = CreateWebhookSut(client);

        await sut.CheckAndEscalateAsync(CancellationToken.None);
        await sut.CheckAndEscalateAsync(CancellationToken.None);

        GovernanceApprovalRequest? updated = await _approvalRepo.GetByIdAsync(request.ApprovalRequestId, CancellationToken.None);
        updated!.SlaBreachNotifiedUtc.Should().NotBeNull();
        handler.Calls.Should().Be(1);
    }

    [Fact]
    public async Task FailedHttpWebhook_RemainsUnnotifiedAndRetriesOnNextCheck()
    {
        GovernanceApprovalRequest request = await CreateBreachedRequestAsync();
        StubWebhookHandler handler = new(() => new HttpResponseMessage(System.Net.HttpStatusCode.BadRequest));
        using HttpClient client = new(handler);
        ApprovalSlaMonitor sut = CreateWebhookSut(client);

        await sut.CheckAndEscalateAsync(CancellationToken.None);
        GovernanceApprovalRequest? first = await _approvalRepo.GetByIdAsync(request.ApprovalRequestId, CancellationToken.None);
        first!.SlaBreachNotifiedUtc.Should().BeNull();

        await sut.CheckAndEscalateAsync(CancellationToken.None);
        GovernanceApprovalRequest? second = await _approvalRepo.GetByIdAsync(request.ApprovalRequestId, CancellationToken.None);
        second!.SlaBreachNotifiedUtc.Should().BeNull();
        handler.Calls.Should().Be(2);
    }

    [Fact]
    public async Task ThrowingWebhook_RemainsUnnotified()
    {
        GovernanceApprovalRequest request = await CreateBreachedRequestAsync();
        StubWebhookHandler handler = new(() => throw new HttpRequestException("simulated delivery failure"));
        using HttpClient client = new(handler);
        ApprovalSlaMonitor sut = CreateWebhookSut(client);

        await sut.CheckAndEscalateAsync(CancellationToken.None);

        GovernanceApprovalRequest? updated = await _approvalRepo.GetByIdAsync(request.ApprovalRequestId, CancellationToken.None);
        updated!.SlaBreachNotifiedUtc.Should().BeNull();
        handler.Calls.Should().BeGreaterThan(0);
    }

}
