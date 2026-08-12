"""Split ServiceCollectionExtensions.Agents.cs into focused partials."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC = REPO_ROOT / "ArchLucid.Host.Composition" / "Startup" / "ServiceCollectionExtensions.Agents.cs"
OUT_DIR = REPO_ROOT / "ArchLucid.Host.Composition" / "Startup"

METHOD_GROUPS: dict[str, list[str]] = {
    "ServiceCollectionExtensions.Agents.cs": ["RegisterAgentExecution"],
    "ServiceCollectionExtensions.Agents.CompletionPipeline.cs": [
        "ConfigureLlmTelemetryLabels",
        "RegisterEchoAgentCompletionPipeline",
        "RegisterFakeAgentCompletionClient",
        "RegisterAzureOpenAiCircuitBreakerOptions",
        "ApplySharedOpenAiCircuitBreakerFallback",
        "CreateOpenAiCircuitBreakerGate",
        "IsAgentRuntimeCompletionCacheEnabled",
        "WrapWithAgentRuntimeCompletionCacheIfEnabled",
        "BuildAgentOutputSemanticJudgeCompletionChain",
    ],
    "ServiceCollectionExtensions.Agents.LlmBatch.cs": ["RegisterLlmBatchServices"],
    "ServiceCollectionExtensions.Agents.AzureCompletion.cs": [
        "BuildAzureOpenAiScopedCompletionChain",
        "BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry",
        "BuildAzureOpenAiScopedCompletionChainCore",
        "RegisterSchemaRemediationAgentCompletionClient",
        "ResolveLlmMaxRetryAttempts",
        "ResolveStructuredOutputAgentResultSchema",
    ],
    "ServiceCollectionExtensions.Agents.TierRouting.cs": [
        "RegisterAgentModelTierOrchestration",
        "RegisterPassThroughTierCompletionRouter",
        "RegisterTieredAzureCompletionRouter",
        "RegisterAgentCompletionClientFromTierRouter",
    ],
}

METHOD_START_RE = re.compile(
    r"^    private static (?:void|.+?)\s+(\w+)\(",
    re.MULTILINE,
)
CLASS_OPEN_RE = re.compile(r"^public static partial class ServiceCollectionExtensions\s*$", re.MULTILINE)


def find_method_end(text: str, start: int) -> int:
    brace_depth = 0
    started = False
    paren_depth = 0
    in_string = False
    escape = False
    expression_body = False

    for index in range(start, len(text)):
        char = text[index]

        if not in_string and char == "=" and text[index : index + 2] == "=>":
            expression_body = True

        if in_string:
            if escape:
                escape = False
                continue

            if char == "\\":
                escape = True
                continue

            if char == '"':
                in_string = False

            continue

        if char == '"':
            in_string = True
            continue

        if char == "(":
            paren_depth += 1
        elif char == ")":
            paren_depth = max(0, paren_depth - 1)
        elif char == "{":
            brace_depth += 1
            started = True
        elif char == "}":
            brace_depth -= 1

            if started and brace_depth == 0:
                return index + 1
        elif char == ";" and not started and paren_depth == 0 and expression_body:
            return index + 1

    return len(text)


def find_method_start(text: str, match_start: int) -> int:
    line_start = text.rfind("\n", 0, match_start) + 1
    cursor = line_start

    while cursor > 0:
        prev_newline = text.rfind("\n", 0, cursor - 1)
        prev_line = text[prev_newline + 1 : cursor]

        if prev_line.strip() == "":
            cursor = prev_newline + 1
            continue

        if prev_line.lstrip().startswith("///") or prev_line.lstrip().startswith("["):
            cursor = prev_newline + 1
            continue

        break

    return cursor


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    class_match = CLASS_OPEN_RE.search(text)
    if class_match is None:
        raise SystemExit("Could not find partial class declaration")

    preamble = text[: class_match.start()]
    matches = list(METHOD_START_RE.finditer(text))
    methods: dict[str, str] = {}

    for match in matches:
        name = match.group(1)
        start = find_method_start(text, match.start())
        end = find_method_end(text, match.start())
        methods[name] = text[start:end].rstrip() + "\n"

    method_to_file = {
        method: filename for filename, names in METHOD_GROUPS.items() for method in names
    }

    missing = set(method_to_file) - set(methods)
    extra = set(methods) - set(method_to_file)

    if missing:
        raise SystemExit(f"Missing methods: {sorted(missing)}")

    if extra:
        raise SystemExit(f"Unassigned methods: {sorted(extra)}")

    for filename, method_names in METHOD_GROUPS.items():
        body = "\n".join(methods[name].rstrip() for name in method_names) + "\n"
        content = (
            preamble
            + "public static partial class ServiceCollectionExtensions\n"
            + "{\n"
            + body
            + "}\n"
        )
        (OUT_DIR / filename).write_text(content, encoding="utf-8")
        print(f"wrote {filename} ({len(method_names)} methods)")


if __name__ == "__main__":
    main()
