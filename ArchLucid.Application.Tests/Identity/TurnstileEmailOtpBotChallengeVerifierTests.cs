using System.Net;
using System.Text;

using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class TurnstileEmailOtpBotChallengeVerifierTests
{
    [Fact]
    public async Task VerifyAsync_returns_false_when_secret_missing()
    {
        StubHttpClientFactory factory = new(_ => new HttpResponseMessage(HttpStatusCode.OK));
        TurnstileEmailOtpBotChallengeVerifier sut = new(
            factory,
            Options.Create(
                new EmailOtpAuthOptions
                {
                    BotChallenge = new EmailOtpBotChallengeOptions
                    {
                        Provider = EmailOtpBotChallengeProvider.Turnstile,
                        SecretKey = string.Empty
                    }
                }));

        bool verified = await sut.VerifyAsync("token", CancellationToken.None);

        verified.Should().BeFalse();
        factory.SendCount.Should().Be(0);
    }

    [Fact]
    public async Task VerifyAsync_returns_true_when_siteverify_reports_success()
    {
        StubHttpClientFactory factory = new(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"success\":true}", Encoding.UTF8, "application/json")
        });

        TurnstileEmailOtpBotChallengeVerifier sut = new(
            factory,
            Options.Create(
                new EmailOtpAuthOptions
                {
                    BotChallenge = new EmailOtpBotChallengeOptions
                    {
                        Provider = EmailOtpBotChallengeProvider.Turnstile,
                        SecretKey = "secret"
                    }
                }));

        bool verified = await sut.VerifyAsync("token", CancellationToken.None);

        verified.Should().BeTrue();
        factory.SendCount.Should().Be(1);
    }

    [Fact]
    public async Task VerifyAsync_returns_false_when_siteverify_reports_failure()
    {
        StubHttpClientFactory factory = new(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"success\":false}", Encoding.UTF8, "application/json")
        });

        TurnstileEmailOtpBotChallengeVerifier sut = new(
            factory,
            Options.Create(
                new EmailOtpAuthOptions
                {
                    BotChallenge = new EmailOtpBotChallengeOptions
                    {
                        Provider = EmailOtpBotChallengeProvider.Turnstile,
                        SecretKey = "secret"
                    }
                }));

        bool verified = await sut.VerifyAsync("token", CancellationToken.None);

        verified.Should().BeFalse();
    }

    private sealed class StubHttpClientFactory(Func<HttpRequestMessage, HttpResponseMessage> handler) : IHttpClientFactory
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler =
            handler ?? throw new ArgumentNullException(nameof(handler));

        public int SendCount { get; private set; }

        public HttpClient CreateClient(string name)
        {
            _ = name;

            return new HttpClient(new StubHandler(this, _handler));
        }

        private sealed class StubHandler(
            StubHttpClientFactory owner,
            Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(
                HttpRequestMessage request,
                CancellationToken cancellationToken)
            {
                _ = cancellationToken;
                owner.SendCount++;

                return Task.FromResult(handler(request));
            }
        }
    }
}
