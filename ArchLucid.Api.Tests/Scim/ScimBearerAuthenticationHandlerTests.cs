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
    public async Task HandleAuthenticateAsync_succeeds_when_cr_suffix_on_first_segment_before_comma_lists_revoked_token_before_valid_one()
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
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\r, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_bearer_scheme_only_crlf_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\r\n, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_authorization_header_value_is_whitespace_only()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = "   ";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("Bearer scheme");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_using_first_valid_credential_when_two_distinct_tokens_resolve_to_same_tenant()
    {
        const string firstToken = "archlucid_scim.first.secret";
        const string secondToken = "archlucid_scim.second.secret";
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid firstRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid secondRowId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(firstToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = tenantId,
                    TokenRowId = firstRowId,
                });
        authenticator
            .Setup(a => a.TryAuthenticateAsync(secondToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = tenantId,
                    TokenRowId = secondRowId,
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {firstToken}, Bearer {secondToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal!.FindFirst("scim_token_id")!.Value.Should().Be(firstRowId.ToString("D"));
        authenticator.Verify(
            a => a.TryAuthenticateAsync(firstToken, It.IsAny<CancellationToken>()),
            Times.Once);
        authenticator.Verify(
            a => a.TryAuthenticateAsync(secondToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_empty_authorization_header_value_precedes_bearer_value()
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
            string.Empty,
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
    public async Task HandleAuthenticateAsync_succeeds_when_fullwidth_vertical_line_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFF5C, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_backslash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\\, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_solidus_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer/, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_fullwidth_reverse_solidus_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFF3C, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_division_slash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2215, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_fraction_slash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2044, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_set_minus_slash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2216, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_box_drawings_diagonal_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2571, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_fullwidth_solidus_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFF0F, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_big_solidus_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u29F8, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_halfwidth_reverse_solidus_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFE68, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_big_solidus_inverse_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u29F9, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_asterisk_operator_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2217, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_multiplication_sign_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u00D7, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_ring_operator_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2218, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_division_sign_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u00F7, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_wave_dash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u301C, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_horizontal_bar_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2015, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_en_dash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2013, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_em_dash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2014, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_presentation_form_vertical_em_dash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFE31, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_unicode_hyphen_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2010, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_figure_dash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\u2012, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_small_em_dash_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFE58, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_bearer_scheme_only_segment_precedes_comma_folded_valid_credential()
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
        http.Request.Headers.Authorization = $"Bearer, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_slash_only_segment_precedes_double_comma_before_valid_credential()
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
        http.Request.Headers.Authorization = $"Bearer/,, Bearer {ValidToken}";

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
    public async Task HandleAuthenticateAsync_fails_when_single_tab_joins_two_bearer_credentials_in_one_segment()
    {
        const string revokedToken = "archlucid_scim.revoked.secret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {revokedToken}\tBearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        authenticator.Verify(
            a => a.TryAuthenticateAsync($"{revokedToken}\tBearer {ValidToken}", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_vertical_tab_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\v, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_form_feed_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\f, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_narrow_no_break_space_follows_bearer_scheme()
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
        http.Request.Headers.Authorization = $"Bearer\u00A0{ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_bearer_scheme_is_glued_to_token_without_separating_whitespace()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer{ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_comma_in_authorization_value_splits_bearer_token_material()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync("archlucid_scim.public.secret", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = "Bearer archlucid_scim.public.secret,extra";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("mixes Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_zero_width_space_prefixes_bearer_token_material()
    {
        string tokenWithZwsp = "\u200B" + ValidToken;

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(tokenWithZwsp, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimBearerAuthenticationResult?)null);

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {tokenWithZwsp}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(tokenWithZwsp, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_invokes_authenticator_with_supplementary_unicode_in_token_material()
    {
        const string tokenWithSurrogate = "archlucid_scim.public.\uD83D\uDE00";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();
        authenticator
            .Setup(a => a.TryAuthenticateAsync(tokenWithSurrogate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ScimBearerAuthenticationResult
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    TokenRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                });

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {tokenWithSurrogate}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(tokenWithSurrogate, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_fails_when_authorization_value_is_truncated_at_interior_nul_before_authenticator()
    {
        const string tokenWithNul = "archlucid_scim.public.sec\0ret";

        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"Bearer {tokenWithNul}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
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
    public async Task HandleAuthenticateAsync_fails_when_comma_folded_header_mixes_ntlm_and_bearer_schemes()
    {
        Mock<IScimBearerTokenAuthenticator> authenticator = new();

        DefaultHttpContext http = new();
        http.Request.Headers.Authorization = $"NTLM TlRMTVNTUAABAAAABoIIAAAAAAAAAAAAAAAAAAAAAAA=, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("mixes Bearer");
        authenticator.Verify(
            a => a.TryAuthenticateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_whitespace_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer    , Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
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
