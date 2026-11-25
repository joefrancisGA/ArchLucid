using ArchLucid.Api.Security;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using System.Diagnostics;
using ArchLucid.Api.Tests;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// Isolated API factory enables the SecureNow exchange only inside this test host.
/// Production feature configuration is untouched.
/// </summary>
public sealed class SecureNowExchangeEnabledApiFactory : ArchLucidApiFactory
{
    // A real host has a deny-all evidence entitlement authority until a trusted
    // issuer is deployed. Only this isolated fixture knows the seeded run ID.
    private readonly SeededTestEvidenceEntitlementAuthority _testEntitlements = new();

    public void GrantSeededTestRun(Guid runId) => _testEntitlements.Allow(runId);

    public string TestEntitlementDiagnosticCounts => _testEntitlements.DiagnosticCounts;

    // DiagnosticListener receives the exception handled by the real API pipeline.
    // Only exception type and method names are retained; no messages or request data.
    public string SnapshotExceptionSummary { get; private set; } = "none observed";

    public IDisposable ObserveSnapshotExceptions()
    {
        var observer = new ListenerObserver(this);
        observer.Attach();
        return observer;
    }

    private sealed class ListenerObserver(SecureNowExchangeEnabledApiFactory owner)
        : IObserver<DiagnosticListener>, IDisposable
    {
        private readonly List<IDisposable> _subscriptions = new();
        private IDisposable? _allListeners;
        public void Attach() => _allListeners = DiagnosticListener.AllListeners.Subscribe(this);
        public void OnNext(DiagnosticListener listener)
        {
            if (listener.Name == "Microsoft.AspNetCore")
                _subscriptions.Add(listener.Subscribe(new EventObserver(owner)));
        }
        public void OnError(Exception error) { }
        public void OnCompleted() { }
        public void Dispose()
        {
            _allListeners?.Dispose();
            foreach (IDisposable subscription in _subscriptions)
                subscription.Dispose();
        }
    }

    private sealed class EventObserver(SecureNowExchangeEnabledApiFactory owner)
        : IObserver<KeyValuePair<string, object?>>
    {
        public void OnNext(KeyValuePair<string, object?> value)
        {
            if (value.Key != "Microsoft.AspNetCore.Diagnostics.HandledException" || value.Value is null)
                return;
            var context = value.Value.GetType().GetProperty("httpContext")?.GetValue(value.Value) as HttpContext;
            if (context?.Request.Path.Value != "/v1/evidence-graph/snapshot")
                return;
            Exception? error = context.Features.Get<IExceptionHandlerFeature>()?.Error;
            if (error is null)
                return;
            owner.SnapshotExceptionSummary = error.GetType().FullName + ": " +
                string.Join(" | ", new StackTrace(error).GetFrames().Take(12)
                    .Select(frame => frame.GetMethod()?.DeclaringType?.FullName + "." + frame.GetMethod()?.Name));
        }
        public void OnError(Exception error) { }
        public void OnCompleted() { }
    }

    public int GrantedRequestCount => _testEntitlements.GrantedRequestCount;

    public bool IsSeededEntitlementAuthority(IEvidenceEntitlementAuthority authority) =>
        ReferenceEquals(authority, _testEntitlements);

    public SecureNowExchangeEnabledApiFactory() : base(sqlAuthorityStorage: true) { }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IEvidenceEntitlementAuthority>();
            services.AddSingleton<IEvidenceEntitlementAuthority>(_testEntitlements);
        });
    }

    protected override void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
        base.ApplySqlCatalogCustomSettings(settings);
        settings["FeatureManagement:SecureNow.ReadOnlySnapshotExchange"] = "true";
    }
}