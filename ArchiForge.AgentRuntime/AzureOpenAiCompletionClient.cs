using System.ClientModel;
using Azure.AI.OpenAI;
using OpenAI.Chat;

namespace ArchiForge.AgentRuntime;

public sealed class AzureOpenAiCompletionClient : IAgentCompletionClient
{
    private readonly ChatClient _chatClient;

    public AzureOpenAiCompletionClient(
        string endpoint,
        string apiKey,
        string deploymentName)
    {
        var azureClient = new AzureOpenAIClient(
            new Uri(endpoint),
            new ApiKeyCredential(apiKey));

        _chatClient = azureClient.GetChatClient(deploymentName);
    }

    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        };

        var options = new ChatCompletionOptions
        {
            Temperature = 0.1f,
            ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat()
        };

        var response = await _chatClient.CompleteChatAsync(
            messages,
            options,
            cancellationToken);

        return response.Value.Content[0].Text;
    }
}
