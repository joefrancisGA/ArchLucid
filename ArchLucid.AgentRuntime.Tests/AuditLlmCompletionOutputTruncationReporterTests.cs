using ArchLucid.AgentRuntime;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AuditLlmCompletionOutputTruncationReporterTests
{
    [Fact]
    public async Task Report_writes_audit_event_with_truncation_metadata()
    {
        Mock<IAuditService> auditService = new();
        TaskCompletionSource<bool> logged = new(TaskCreationOptions.RunContinuationsAsynchronously);
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((_, _) => logged.TrySetResult(true))
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = tenantId,
            });

        ServiceCollection services = new();
        services.AddSingleton(auditService.Object);
        ServiceProvider serviceProvider = services.BuildServiceProvider();

        AuditLlmCompletionOutputTruncationReporter reporter = new(
            serviceProvider.GetRequiredService<IServiceScopeFactory>(),
            scopeProvider.Object,
            NullLogger<AuditLlmCompletionOutputTruncationReporter>.Instance);

        reporter.Report(new LlmCompletionOutputTruncationEvent("gpt-5.6-terra", 4096, 4096, 0));

        await logged.Task.WaitAsync(TimeSpan.FromSeconds(5));

        auditService.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.LlmCompletionOutputTruncated
                    && e.TenantId == tenantId
                    && e.DataJson!.Contains("maxOutputTokens", StringComparison.Ordinal)
                    && e.DataJson.Contains("4096", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
