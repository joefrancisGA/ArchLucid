using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Claims;

using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

public sealed class BrandAssetControllerRoutingTests
{
    [Fact]
    public async Task Upload_returns_created_with_a_working_versioned_content_location()
    {
        const string collectionPath = "/v1/infra-evidence/branding/assets";
        const string fileName = "logo.png";
        byte[] png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAETr19kAAAAASUVORK5CYII=");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };
        BrandAssetRecord asset = new()
        {
            AssetId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            AssetType = BrandAssetType.LogoPrimary,
            OriginalFileName = fileName,
            MimeType = "image/png",
        };
        Mock<IBrandAssetService> assets = new();
        assets.Setup(service => service.UploadAsync(scope, It.IsAny<BrandAssetUploadRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BrandAssetUploadResult { Succeeded = true, Asset = asset });
        assets.Setup(service => service.TryGetAssetAsync(scope, asset.AssetId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BrandAssetReadResult { Succeeded = true, Asset = asset, AssetBytes = png });
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = scope.TenantId, Tier = TenantTier.Standard });
        Mock<IAuditService> audit = new();
        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        WebApplicationBuilder builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton(assets.Object);
        builder.Services.AddSingleton(scopeProvider.Object);
        builder.Services.AddSingleton(tenants.Object);
        builder.Services.AddSingleton(audit.Object);
        builder.Services.AddAuthentication();
        builder.Services.AddAuthorization(options => options.AddPolicy(
            ArchLucidPolicies.AdminAuthority,
            policy => policy.RequireAuthenticatedUser()));
        builder.Services.AddRateLimiter(options => options.AddFixedWindowLimiter("fixed", limiter =>
        {
            limiter.PermitLimit = 10;
            limiter.Window = TimeSpan.FromMinutes(1);
        }));
        builder.Services.AddControllers().ConfigureApplicationPartManager(manager =>
        {
            manager.ApplicationParts.Clear();
            manager.ApplicationParts.Add(new BrandAssetControllerPart());
        });
        builder.Services.AddApiVersioning(options => options.ApiVersionReader = new UrlSegmentApiVersionReader()).AddMvc();

        await using WebApplication app = builder.Build();
        app.UseRouting();
        app.Use((context, next) =>
        {
            context.User = new ClaimsPrincipal(
                new ClaimsIdentity([new Claim(ClaimTypes.Name, "routing-test-admin")], "routing-test"));
            return next(context);
        });
        app.UseAuthorization();
        app.UseRateLimiter();
        app.MapControllers();
        await app.StartAsync();

        using HttpClient client = app.GetTestClient();
        using MultipartFormDataContent form = new();
        using ByteArrayContent file = new(png);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(file, "file", fileName);
        form.Add(new StringContent(nameof(BrandAssetType.LogoPrimary)), "assetType");
        using HttpResponseMessage upload = await client.PostAsync(collectionPath, form);

        // Oracle: the checked-in v1 OpenAPI contract declares 201 and the versioned asset content GET route.
        Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
        Uri location = Assert.IsType<Uri>(upload.Headers.Location);
        Assert.Equal($"{collectionPath}/{asset.AssetId:D}/content", new Uri(client.BaseAddress!, location).AbsolutePath);

        using HttpResponseMessage download = await client.GetAsync(location);
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("image/png", download.Content.Headers.ContentType?.MediaType);
        Assert.Equal(png, await download.Content.ReadAsByteArrayAsync());
    }

    private sealed class BrandAssetControllerPart : ApplicationPart, IApplicationPartTypeProvider
    {
        public override string Name => nameof(BrandAssetControllerPart);

        public IEnumerable<TypeInfo> Types => [typeof(BrandAssetController).GetTypeInfo()];
    }
}
