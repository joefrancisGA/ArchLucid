namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Stable Ask user-message prefix for Azure prompt-cache alignment (TB-681).</summary>
internal static class AskUserPromptStaticPrefix
{
    internal const string ArchitectUserPrefix =
        "Answer using ONLY the sections below (structured context, retrieved evidence, conversation history, user question). " +
        "Do not invent services, findings, artifacts, or costs not present in the supplied materials.\n\n";
}
