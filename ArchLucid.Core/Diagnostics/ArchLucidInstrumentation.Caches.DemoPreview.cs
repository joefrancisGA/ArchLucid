using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidInstrumentation
{
    /// <summary>In-process cache hits for <c>GET /v1/demo/preview</c> (marketing commit-page bundle).</summary>
    public static readonly Counter<long> DemoPreviewCacheHits =
        AppMeter.CreateCounter<long>(
            "archlucid.demo.preview.cache_hit_total",
            description: "Demo marketing preview bundle cache hits (GET /v1/demo/preview).");

    /// <summary>In-process cache misses for <c>GET /v1/demo/preview</c> (factory invoked).</summary>
    public static readonly Counter<long> DemoPreviewCacheMisses =
        AppMeter.CreateCounter<long>(
            "archlucid.demo.preview.cache_miss_total",
            description: "Demo marketing preview bundle cache misses (GET /v1/demo/preview).");
}
