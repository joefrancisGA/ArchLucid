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

    public static TheoryData<string> BearerDelimiterPlaceholderCodePoints { get; } = new()
    {
        "\uFF5C", // U+FF5C FULLWIDTH VERTICAL LINE
        "\\", // U+005C REVERSE SOLIDUS
        "/", // U+002F SOLIDUS
        "\uFF3C", // U+FF3C FULLWIDTH REVERSE SOLIDUS
        "\u2215", // U+2215 DIVISION SLASH
        "\u2044", // U+2044 FRACTION SLASH
        "\u2216", // U+2216 SET MINUS
        "\u2571", // U+2571 BOX DRAWINGS LIGHT DIAGONAL UPPER RIGHT TO LOWER LEFT
        "\uFF0F", // U+FF0F FULLWIDTH SOLIDUS
        "\u29F8", // U+29F8 BIG SOLIDUS
        "\uFE68", // U+FE68 SMALL REVERSE SOLIDUS
        "\u29F9", // U+29F9 BIG REVERSE SOLIDUS
        "\u2217", // U+2217 ASTERISK OPERATOR
        "\u00D7", // U+00D7 MULTIPLICATION SIGN
        "\u2218", // U+2218 RING OPERATOR
        "\u00F7", // U+00F7 DIVISION SIGN
        "\u301C", // U+301C WAVE DASH
        "\u2015", // U+2015 HORIZONTAL BAR
        "\u2013", // U+2013 EN DASH
        "\u2014", // U+2014 EM DASH
        "\uFE31", // U+FE31 PRESENTATION FORM FOR VERTICAL EM DASH
        "\u2010", // U+2010 HYPHEN
        "\u2012", // U+2012 FIGURE DASH
        "\uFE58", // U+FE58 SMALL EM DASH
        "\u2011", // U+2011 NON-BREAKING HYPHEN
        "\u2016", // U+2016 DOUBLE VERTICAL LINE
        "\uFE57", // U+FE57 SMALL EXCLAMATION MARK
        "\u2017", // U+2017 DOUBLE LOW LINE
        "\u203E", // U+203E OVERLINE
        "\uFE63", // U+FE63 SMALL HYPHEN-MINUS
        "\u02CD", // U+02CD MODIFIER LETTER LOW MACRON
        "\u2502", // U+2502 BOX DRAWINGS LIGHT VERTICAL
        "\u02C2", // U+02C2 MODIFIER LETTER LEFT ARROWHEAD
        "\u2503", // U+2503 BOX DRAWINGS HEAVY VERTICAL
        "\u02C3", // U+02C3 MODIFIER LETTER RIGHT ARROWHEAD
        "\u2551", // U+2551 BOX DRAWINGS DOUBLE VERTICAL
        "\u2506", // U+2506 BOX DRAWINGS LIGHT TRIPLE DASH VERTICAL
        "\u2507", // U+2507 BOX DRAWINGS HEAVY TRIPLE DASH VERTICAL
        "\u2508", // U+2508 BOX DRAWINGS LIGHT QUADRUPLE DASH HORIZONTAL
        "\u2509", // U+2509 BOX DRAWINGS HEAVY QUADRUPLE DASH HORIZONTAL
        "\u2574", // U+2574 BOX DRAWINGS LIGHT LEFT
        "\u2575", // U+2575 BOX DRAWINGS LIGHT UP
        "\u2576", // U+2576 BOX DRAWINGS LIGHT RIGHT
        "\u2577", // U+2577 BOX DRAWINGS LIGHT DOWN
        "\u2578", // U+2578 BOX DRAWINGS HEAVY LEFT
        "\u2579", // U+2579 BOX DRAWINGS HEAVY UP
        "\u257A", // U+257A BOX DRAWINGS HEAVY RIGHT
        "\u257B", // U+257B BOX DRAWINGS HEAVY DOWN
        "\u257C", // U+257C BOX DRAWINGS LIGHT LEFT AND HEAVY RIGHT
        "\u257D", // U+257D BOX DRAWINGS LIGHT UP AND HEAVY DOWN
        "\u257E", // U+257E BOX DRAWINGS HEAVY LEFT AND LIGHT RIGHT
        "\u257F", // U+257F BOX DRAWINGS HEAVY UP AND LIGHT DOWN
        "\u2580", // U+2580 UPPER HALF BLOCK
        "\u2582", // U+2582 LOWER ONE QUARTER BLOCK
        "\u2583", // U+2583 LOWER THREE EIGHTHS BLOCK
        "\u2584", // U+2584 LOWER HALF BLOCK
        "\u2585", // U+2585 LOWER FIVE EIGHTHS BLOCK
        "\u2586", // U+2586 LOWER THREE QUARTERS BLOCK
        "\u2587", // U+2587 LOWER SEVEN EIGHTHS BLOCK
        "\u2588", // U+2588 FULL BLOCK
        "\u2589", // U+2589 LEFT SEVEN EIGHTHS BLOCK
        "\u258A", // U+258A LEFT THREE QUARTERS BLOCK
        "\u258B", // U+258B LEFT FIVE EIGHTHS BLOCK
        "\u258C", // U+258C LEFT HALF BLOCK
        "\u258D", // U+258D LEFT THREE EIGHTHS BLOCK
        "\u258E", // U+258E LEFT ONE QUARTER BLOCK
        "\u258F", // U+258F LEFT ONE EIGHTH BLOCK
        "\u2590", // U+2590 RIGHT HALF BLOCK
        "\u2591", // U+2591 LIGHT SHADE
        "\u2592", // U+2592 MEDIUM SHADE
        "\u2593", // U+2593 DARK SHADE
        "\u2594", // U+2594 UPPER ONE EIGHTH BLOCK
        "\u2595", // U+2595 RIGHT ONE EIGHTH BLOCK
        "\u2596", // U+2596 QUADRANT LOWER LEFT
        "\u2597", // U+2597 QUADRANT LOWER RIGHT
        "\u2598", // U+2598 QUADRANT UPPER LEFT
        "\u2599", // U+2599 QUADRANT UPPER LEFT AND LOWER LEFT AND LOWER RIGHT
        "\u259A", // U+259A QUADRANT UPPER LEFT AND LOWER RIGHT
        "\u259B", // U+259B QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER LEFT
        "\u259C", // U+259C QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER RIGHT
        "\u259D", // U+259D QUADRANT UPPER RIGHT
        "\u259E", // U+259E QUADRANT UPPER RIGHT AND LOWER LEFT
        "\u259F", // U+259F QUADRANT UPPER RIGHT AND LOWER LEFT AND LOWER RIGHT
        "\u25A0", // U+25A0 BLACK SQUARE
        "\u25A1", // U+25A1 WHITE SQUARE
        "\u25AA", // U+25AA BLACK SMALL SQUARE
        "\u25AB", // U+25AB WHITE SMALL SQUARE
        "\u25B2", // U+25B2 BLACK UP-POINTING TRIANGLE
        "\u25BC", // U+25BC BLACK DOWN-POINTING TRIANGLE
        "\u25C6", // U+25C6 BLACK DIAMOND
        "\u25C7", // U+25C7 WHITE DIAMOND
        "\u25CF", // U+25CF BLACK CIRCLE
        "\u25CB", // U+25CB WHITE CIRCLE
        "\u25CE", // U+25CE BULLSEYE
        "\u25D0", // U+25D0 CIRCLE WITH LEFT HALF BLACK
        "\u25D1", // U+25D1 CIRCLE WITH RIGHT HALF BLACK
        "\u25D2", // U+25D2 CIRCLE WITH LOWER HALF BLACK
        "\u25D3", // U+25D3 CIRCLE WITH UPPER HALF BLACK
        "\u25D4", // U+25D4 CIRCLE WITH UPPER RIGHT QUADRANT BLACK
        "\u25D5", // U+25D5 CIRCLE WITH ALL BUT UPPER LEFT QUADRANT BLACK
        "\u25D6", // U+25D6 LEFT HALF BLACK CIRCLE
    };

    public static TheoryData<string> BearerWhitespaceOnlySegments { get; } = new()
    {
        " ", // U+0020 SPACE
        "\v", // U+000B
        "\f", // U+000C
    };

    [Theory]
    [MemberData(nameof(BearerDelimiterPlaceholderCodePoints))]
    public async Task HandleAuthenticateAsync_succeeds_when_delimiter_placeholder_only_bearer_segment_precedes_valid_comma_folded_credential(
        string placeholder)
    {
        await AssertPlaceholderOnlySegmentSucceedsAsync(placeholder);
    }

    [Theory]
    [MemberData(nameof(BearerWhitespaceOnlySegments))]
    public async Task HandleAuthenticateAsync_succeeds_when_whitespace_only_bearer_segment_precedes_valid_comma_folded_credential(
        string placeholder)
    {
        await AssertPlaceholderOnlySegmentSucceedsAsync(placeholder);
    }

    private async Task AssertPlaceholderOnlySegmentSucceedsAsync(string placeholder)
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
        http.Request.Headers.Authorization = $"Bearer{placeholder}, Bearer {ValidToken}";

        ScimBearerAuthenticationHandlerTestDouble handler = CreateHandler(authenticator.Object, http);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        authenticator.Verify(
            a => a.TryAuthenticateAsync(ValidToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAuthenticateAsync_succeeds_when_doubled_fullwidth_vertical_line_only_bearer_segment_precedes_valid_comma_folded_credential()
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
        http.Request.Headers.Authorization = $"Bearer\uFF5C\uFF5C, Bearer {ValidToken}";

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
    public async Task HandleAuthenticateAsync_succeeds_when_multiple_whitespace_only_bearer_segment_precedes_valid_comma_folded_credential()
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
