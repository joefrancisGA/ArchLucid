using System.Text.Encodings.Web;

using ArchLucid.Api.Auth.Scim;
using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

using Moq;

namespace ArchLucid.Api.Tests.Scim;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ScimBearerAuthenticationHandlerTests
{
    private const string ValidToken = "archlucid_scim.public.secret";

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_proxy_forwards_duplicate_authorization_header_values()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = new StringValues(
        [
            $"Bearer {ValidToken}",
            $"Bearer {ValidToken}",
        ]);

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_duplicate_bearer_credentials_are_comma_folded_in_one_header()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {ValidToken}, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ScimBearerAuthenticationHandlerTestDouble CreateHandler(
        IScimBearerTokenAuthenticator authenticator,
        HttpContext httpContext)
    {
        Mock<IOptionsMonitor<AuthenticationSchemeOptions>> monitor = new();
        AuthenticationSchemeOptions schemeOptions = new();
        monitor.Setup(m => m.CurrentValue).Returns(schemeOptions);
        monitor.Setup(m => m.Get(It.IsAny<string>())).Returns(schemeOptions);

        ScimBearerAuthenticationHandlerTestDouble handler = new(
            monitor.Object,
            NullLoggerFactory.Instance,
            UrlEncoder.Default,
            authenticator);

        AuthenticationScheme scheme = new(
            ScimBearerDefaults.AuthenticationScheme,
            "SCIM Bearer",
            typeof(ScimBearerAuthenticationHandler));

        handler.InitializeAsync(scheme, httpContext).GetAwaiter().GetResult();

        return handler;
    }

    private sealed class ScimBearerAuthenticationHandlerTestDouble(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory loggerFactory,
        UrlEncoder encoder,
        IScimBearerTokenAuthenticator authenticator)
        : ScimBearerAuthenticationHandler(options, loggerFactory, encoder, authenticator)
    {
        public Task<AuthenticateResult> InvokeHandleAuthenticateAsync() => HandleAuthenticateAsync();
    }
}
