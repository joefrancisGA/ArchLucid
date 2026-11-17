using ArchLucid.Application.Analysis;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests;

/// <summary>Replaces comparison replay with a service that always fails verify, to assert HTTP 422 pipeline.</summary>
public sealed class ComparisonVerify422ApiFactory : ArchLucidApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IComparisonReplayService>();
            services.AddScoped<IComparisonReplayService, ForcedComparisonVerificationFailureReplayService>();
        });
    }
}
