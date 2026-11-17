using System.Collections;
using System.Reflection;

using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.OperationalErrors;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.OperationalErrors;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationalErrorCaptureServiceTests
{
    [Fact]
    public void New_minute_discards_expired_fingerprints_and_resets_the_limit()
    {
        TestClock clock = new();
        InMemoryOperationalErrorCaptureQueue queue = new();
        Mock<IOptionsMonitor<OperationalErrorOptions>> options = new();
        options.SetupGet(x => x.CurrentValue).Returns(new OperationalErrorOptions
        {
            MaxCapturesPerFingerprintPerMinute = 1
        });

        OperationalErrorCaptureService service = new(
            queue, options.Object, NullLogger<OperationalErrorCaptureService>.Instance, clock);
        OperationalErrorCaptureRequest repeated = Request("/same");
        Parallel.For(0, 16, _ => service.TryCapture(repeated));
        service.TryCapture(Request("/old"));
        Assert.Equal(2, queue.ApproximatePendingCount);

        clock.UtcNow = clock.UtcNow.AddMinutes(1);
        service.TryCapture(repeated);
        Assert.Equal(3, queue.ApproximatePendingCount);

        FieldInfo field = typeof(OperationalErrorCaptureService)
            .GetField("_fingerprintWindows", BindingFlags.Instance | BindingFlags.NonPublic)!;
        Assert.Single(Assert.IsAssignableFrom<ICollection>(field.GetValue(service)));
    }

    [Fact]
    public void Fingerprint_limits_are_independent_for_each_tenant_workspace_and_project()
    {
        InMemoryOperationalErrorCaptureQueue queue = new();
        Mock<IOptionsMonitor<OperationalErrorOptions>> options = new();
        options.SetupGet(x => x.CurrentValue).Returns(new OperationalErrorOptions
        {
            MaxCapturesPerFingerprintPerMinute = 1
        });
        OperationalErrorCaptureService service = new(
            queue, options.Object, NullLogger<OperationalErrorCaptureService>.Instance, new TestClock());
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        (Guid Tenant, Guid Workspace, Guid Project)[] scopes =
        [
            (tenant, workspace, project),
            (Guid.NewGuid(), workspace, project),
            (tenant, Guid.NewGuid(), project),
            (tenant, workspace, Guid.NewGuid())
        ];

        foreach (var scope in scopes)
        {
            OperationalErrorCaptureRequest request = new()
            {
                Category = OperationalErrorCategory.HttpError,
                Source = OperationalErrorSource.Api,
                RequestPath = "/same",
                HttpStatusCode = 500,
                TenantId = scope.Tenant,
                WorkspaceId = scope.Workspace,
                ProjectId = scope.Project
            };
            service.TryCapture(request);
            service.TryCapture(request);
        }

        Assert.Equal(scopes.Length, queue.ApproximatePendingCount);
    }

    private static OperationalErrorCaptureRequest Request(string path) => new()
    {
        Category = OperationalErrorCategory.HttpError,
        Source = OperationalErrorSource.Api,
        RequestPath = path,
        HttpStatusCode = 500
    };

    private sealed class TestClock : TimeProvider
    {
        public DateTimeOffset UtcNow { get; set; } = new(2026, 11, 16, 15, 30, 0, TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => UtcNow;
    }
}
