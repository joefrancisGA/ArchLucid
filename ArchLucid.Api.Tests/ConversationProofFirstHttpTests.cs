using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace ArchLucid.Api.Tests;

[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
public sealed class ConversationProofFirstHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData("local")]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    public async Task Direct_history_only_hydrates_proven_messages_in_the_request_scope(string boundary)
    {
        const string actor = "fixture-conversation-reader";
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant, WorkspaceId = ScopeIds.DefaultWorkspace, ProjectId = ScopeIds.DefaultProject,
        };
        ConversationThread thread = new()
        {
            TenantId = boundary == "tenant" ? Guid.NewGuid() : scope.TenantId,
            WorkspaceId = boundary == "workspace" ? Guid.NewGuid() : scope.WorkspaceId,
            ProjectId = boundary == "project" ? Guid.NewGuid() : scope.ProjectId,
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IConversationThreadRepository> threads = new();
        threads.Setup(r => r.GetByIdAsync(thread.ThreadId, It.IsAny<CancellationToken>())).ReturnsAsync(thread);
        Mock<IConversationMessageRepository> messages = new(MockBehavior.Strict);
        Mock<IAskEvidenceAccess> access = new();
        access.Setup(a => a.GetAuthorizedActorId()).Returns(actor);
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(It.IsAny<ScopeContext>(), null, null, RunPagination.MaxTake,
            It.IsAny<CancellationToken>())).ReturnsAsync(new RunListPage([], false));

        if (boundary == "local")
        {
            const string questionText = "current question";
            ConversationMessage question = new()
            {
                ThreadId = thread.ThreadId, Role = ConversationMessageRole.User, Content = questionText,
                MetadataJson = AskHistoryEvidenceScope.CreateQuestionMetadata(thread.ThreadId, questionText),
            };
            ConversationMessage answer = new()
            {
                ThreadId = thread.ThreadId, Role = ConversationMessageRole.Assistant, Content = "current answer",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    askEvidenceScopeV1 = AskHistoryEvidenceScope.Create(thread.ThreadId, actor, new HashSet<Guid>(), questionText, false),
                }, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            };
            ConversationMessage[] allowed = [question, answer];
            var allowedIds = allowed.Select(m => m.MessageId).ToHashSet();
            messages.Setup(r => r.GetRecentProofsAsync(
                    It.Is<ScopeContext>(s => s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                    thread.ThreadId, PaginationDefaults.MaxListingTake, It.IsAny<CancellationToken>()))
                .ReturnsAsync(allowed.Select(ConversationProofRow.FromStoredMetadata).ToArray());
            messages.Setup(r => r.GetAuthorizedMessagesAsync(
                    It.Is<ScopeContext>(s => s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                    thread.ThreadId, It.Is<IReadOnlyCollection<Guid>>(ids => allowedIds.SetEquals(ids)), It.IsAny<CancellationToken>()))
                .ReturnsAsync(allowed);
        }

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(threads.Object);
            services.AddSingleton(messages.Object);
            services.AddSingleton(access.Object);
            services.AddSingleton(runs.Object);
        }));
        using HttpClient client = host.CreateClient();
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            "Direct conversation reader", [ArchLucidRoles.Reader], scope.TenantId, scope.WorkspaceId, scope.ProjectId);
        using HttpRequestMessage request = new(HttpMethod.Get, $"/v1/conversations/{thread.ThreadId:D}/messages");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("x-tenant-id", scope.TenantId.ToString("D"));
        request.Headers.Add("x-workspace-id", scope.WorkspaceId.ToString("D"));
        request.Headers.Add("x-project-id", scope.ProjectId.ToString("D"));
        using HttpResponseMessage response = await client.SendAsync(request);

        if (boundary == "local")
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var payload = await response.Content.ReadFromJsonAsync<List<ConversationMessage>>();
            payload!.Select(m => m.Content).Should().Equal("current question", "current answer");
        }
        else
        {
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            messages.VerifyNoOtherCalls();
        }
    }
}
