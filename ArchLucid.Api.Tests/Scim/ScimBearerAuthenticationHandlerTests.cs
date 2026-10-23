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

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_comma_folded_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()),
            Times.Once);
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_bearer_scheme_uses_tab_separator()
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
        http.Request.Headers.Authorization = $"Bearer\t{ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_bearer_scheme_is_prefixed_with_utf8_bom()
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
        http.Request.Headers.Authorization = $"\uFEFFBearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_separate_authorization_headers_list_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
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
            $"Bearer {revokedToken}",
            $"Bearer {ValidToken}",
        ]);

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_newline_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\nBearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_semicolon_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}; Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_pipe_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken} | Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_vertical_tab_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\vBearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_form_feed_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\fBearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_nul_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\0Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_bearer_scheme_is_uppercase()
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
        http.Request.Headers.Authorization = $"BEARER {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_second_segment_is_prefixed_with_utf8_bom_after_comma()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken},\uFEFFBearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_double_comma_separates_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken},,Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_bearer_scheme_tab_segment_precedes_valid_comma_folded_credential()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\t, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_comma_folded_header_has_empty_first_bearer_segment_before_valid_one()
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
        http.Request.Headers.Authorization = $"Bearer , Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_double_space_separated_header_lists_revoked_token_before_valid_one()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(revokedToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);
        authenticator
            .Setup(a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}  Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_single_space_joins_two_bearer_credentials_in_one_segment()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken} Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        authenticator.Verify(
            a => a.TryAuthenticateAsync($"{revokedToken} Bearer {ValidToken}", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_three_authorization_header_values_each_present_one_bearer_token()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = new StringValues(
        [
            "Bearer one",
            "Bearer two",
            $"Bearer {ValidToken}",
        ]);

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("too many Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_comma_folded_header_mixes_negotiate_and_bearer_schemes()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Negotiate abc, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("mixes Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_three_comma_segments_repeat_the_same_bearer_token()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {ValidToken}, Bearer {ValidToken}, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("too many Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_bearer_token_has_leading_plus_sign()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = "Bearer +archlucid_scim.public.secret";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        authenticator.Verify(
            a => a.TryAuthenticateAsync("+archlucid_scim.public.secret", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_comma_folded_header_mixes_digest_and_bearer_schemes()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Digest username=\"x\", Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("mixes Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_comma_folded_header_mixes_basic_and_bearer_schemes()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Basic dGVzdDp0ZXN0, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("mixes Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_more_than_two_bearer_credentials_are_present()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer one, Bearer two, Bearer three";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("too many Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_two_valid_bearer_tokens_resolve_to_different_tenants()
    {
        const string tokenTenantA = "archlucid_scim.tenant_a.secret";
        const string tokenTenantB = "archlucid_scim.tenant_b.secret";
        Guid tenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantB = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(tokenTenantA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = tenantA,
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });
        authenticator
            .Setup(a => a.TryAuthenticateAsync(tokenTenantB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = tenantB,
                    TokenRowId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {tokenTenantA}, Bearer {tokenTenantB}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("conflicting tenant");
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
