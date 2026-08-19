using ArchLucid.Api.Support;
using ArchLucid.Api.Tests.Http;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]

public sealed class FindingsListAccessTelemetryTests
{
    [Fact]
    public void LogFindingSnapshotExpose_emits_information_with_counters_and_scope_ids()
    {
        RecordingLoggerProvider provider = new();

        using ILoggerFactory lf = LoggerFactory.Create(b =>
        {
            b.ClearProviders();

            _ = b.AddProvider(provider);
        });

        ILogger sut = lf.CreateLogger("FindingsListAccessTelemetryTests.Scope");
        ScopeContext scope =
            new()
            {
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
            };

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        FindingsListAccessTelemetry.LogFindingSnapshotExpose(sut, scope, runId, "TestSurface", 7);

        (LogLevel level, _, string message) = Assert.Single(provider.Entries);

        Assert.Equal(LogLevel.Information, level);

        Assert.Contains("TestSurface", message, StringComparison.Ordinal);
        Assert.Contains("FindingCount=7", message, StringComparison.Ordinal);
        Assert.Contains(runId.ToString(), message, StringComparison.OrdinalIgnoreCase);

        Assert.Contains(scope.TenantId.ToString(), message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(scope.WorkspaceId.ToString(), message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(scope.ProjectId.ToString(), message, StringComparison.OrdinalIgnoreCase);
    }
}
