"""Conservative syntax signals for test integrity review, not semantic proof."""

from collections import Counter
from dataclasses import dataclass
import hashlib
import json
from pathlib import PurePosixPath
import re

TEST_PATH = re.compile(r"(?:^|/)(?:tests?|__tests__|[^/]+\.Tests)(?:/|$)", re.I)
JS_TEST = re.compile(r"\.(?:test|spec)\.[cm]?[jt]sx?$", re.I)
JS_SOURCE = re.compile(r"\.[cm]?[jt]sx?$", re.I)
GOLDEN_PATH = re.compile(r"(?:^|/)(?:__snapshots__|snapshots?|goldens?|golden-corpus)(?:/|$)|\.(?:snap|verified\.[^.]+)$", re.I)
CONFIG_PATH = re.compile(r"(?:^|/)(?:[\w.-]+\.runsettings|[\w.-]+\.csproj|Directory\.Build\.(?:props|targets)|\.editorconfig|GlobalSuppressions\.cs|\.coveragerc|coverage\.xml|(?:vitest|playwright|jest)\.config\.[cm]?[jt]s|package\.json)$", re.I)
SUPPRESSION = re.compile(r"#\s*pragma\s+warning\s+disable|SuppressMessage(?:Attribute)?\s*\(|\bExcludeFromCodeCoverage(?:Attribute)?\b|#[^\n]*(?:noqa|type:\s*ignore|pylint:\s*disable)|@ts-(?:ignore|nocheck)|eslint-disable", re.I)
CONFIG_CONTROL = re.compile(
    r"\b(?:Exclude(?:ByFile|ByAttribute|FromCodeCoverage)?|NoWarn|TestCaseFilter|RunConfiguration|"
    r"testMatch|testIgnore|testPathIgnorePatterns|testRegex|testDir|testExclude|include|exclude|"
    r"collectCoverageFrom|coveragePathIgnorePatterns|omit|exclude_lines|exclude_also|"
    r"Compile\s+Remove|dotnet_diagnostic\.[\w-]+\.severity)\b", re.I)
RUNNER_FILTER = re.compile(r"\b(?:vitest|playwright|jest|dotnet test)\b.*(?:--(?:grep(?:-invert)?|testNamePattern|project|filter|exclude|include|testPathPattern[s]?|shard|passWithNoTests)\b|(?:test|run)\s+[^|&<>\s]+)", re.I)
TOKEN = re.compile(
    r'(?P<skip>\s+|//[^\n]*|/\*[\s\S]*?\*/)|'
    r'(?P<string>(?P<raw>"{3,})[\s\S]*?(?P=raw)(?!")|@"(?:""|[^"])*"|'
    r'"(?:\\[\s\S]|[^"\\\n])*"|\x27(?:\\[\s\S]|[^\x27\\\n])*\x27|`(?:\\[\s\S]|[^`\\])*`)|'
    r'(?P<code>[A-Za-z_$][\w$]*|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|=>|==|!=|<=|>=|\?\.|.)',
    re.DOTALL,
)
IDENTITY_LIMIT = 32


@dataclass(frozen=True)
class Anchor:
    family: str
    key: str
    line: int
    test: str | None = None


def token_anchors(source: str, kind: str) -> list[Anchor]:
    tokens, lines = [], []
    line = 1
    for match in TOKEN.finditer(source):
        chunk = match[0]
        if not match["skip"]:
            if not match["string"] and (chunk in {'"', "'", "`"} or source.startswith("/*", match.start())):
                raise ValueError("unclosed literal or comment")
            tokens.append(chunk)
            lines.append(line)
        line += chunk.count("\n")

    end_at, stack = {}, []
    close = {")": "(", "]": "[", "}": "{"}
    for i, token in enumerate(tokens):
        if token in close.values():
            stack.append((token, i))
        elif token in close:
            if not stack or stack[-1][0] != close[token]:
                raise ValueError("unbalanced delimiters in lexical scan")
            _, start = stack.pop()
            end_at[start] = i
    if stack:
        raise ValueError("unclosed delimiters in lexical scan")

    anchors = []
    current = None
    scope_end = -1

    def add(family: str, start: int, end: int) -> None:
        anchors.append(Anchor(family, json.dumps(tokens[start:end], ensure_ascii=False, separators=(",", ":")),
                              lines[start], current))

    def call_end(start: int) -> int | None:
        if start < len(tokens) and tokens[start] == "<":
            depth = 0
            for j in range(start, min(start + IDENTITY_LIMIT, len(tokens))):
                if tokens[j] == "<":
                    depth += 1
                elif tokens[j] == ">":
                    depth -= 1
                    if depth == 0:
                        start = j + 1
                        break
                elif tokens[j] in {";", "=", "{", "}"}:
                    return None
            else:
                return None
        return end_at.get(start) if start < len(tokens) and tokens[start] == "(" else None

    for i, token in enumerate(tokens):
        if i > scope_end:
            current = None
        next3 = tokens[i + 1:i + 4]
        if current and re.fullmatch(r"(?:expected|tolerance)[A-Za-z_0-9]*", token, re.I) and next3[:1] == ["="]:
            end = i + 2
            while end < len(tokens) and end <= min(i + 160, scope_end) and tokens[end] not in {";", "}"}:
                end = end_at.get(end, end) + 1
            add("expected-outcome", i, end)
        if kind == "dotnet-test":
            if token in {"Fact", "Theory", "FactAttribute", "TheoryAttribute", "Test", "TestCase",
                         "TestMethod", "DataTestMethod", "TestCaseSource"} and tokens[i-1:i] == ["["]:
                for j in range(end_at.get(i-1, i) + 1, min(i + 100, len(tokens))):
                    if tokens[j] == "[" and j in end_at:
                        continue
                    if (tokens[j] == "(" and j >= 2 and
                            re.fullmatch(r"[\w$]+", tokens[j - 1]) and tokens[j - 2] not in {"[", "."}):
                        current = tokens[j - 1]
                        params_end = end_at[j]
                        body_start = params_end + 1
                        scope_end = end_at.get(body_start, body_start)
                        if tokens[body_start:body_start + 1] == ["=>"]:
                            scope_end = next((n for n in range(body_start, len(tokens)) if tokens[n] == ";"), body_start)
                        body = tokens[j:scope_end + 1]
                        anchors.append(Anchor("test-declaration", json.dumps([current, body]), lines[j-1], current))
                        break
                    if tokens[j] in {";", "{", "}"}:
                        break
                stop = end_at.get(i-1, i)
                for j in range(i + 1, stop):
                    if tokens[j] in {"Skip", "SkipWhen", "SkipUnless", "Explicit"}:
                        add("skip-or-exclusive", j, min(stop, j + 3))
            if token in {"Ignore", "Explicit", "Skip"} and tokens[i-1:i] == ["["]:
                add("skip-or-exclusive", i, end_at[i-1])
            if token in {"Assert", "CollectionAssert", "StringAssert"} and next3[:1] == ["."] and len(next3) >= 2:
                end = call_end(i + 3)
                if end is not None:
                    family = assertion_family(next3[1])
                    add(family, i, end + 1)
            if token in {"Should", "ShouldNotBe", "ShouldBe"} and tokens[i-1:i] == ["."]:
                end = call_end(i + 1)
                if end is not None:
                    last, method = chain(end, tokens, call_end)
                    if token != "Should" or last != end:
                        add(assertion_family(method or token), max(0, i - 2), last + 1)
            if ((token == "Mock" and tokens[i-1:i] == ["new"]) or
                    (token in {"Substitute", "A", "Mock"} and next3[:2] in ([".", "For"], [".", "Fake"], [".", "Of"])) or
                    (token in {"Setup", "SetupSequence"} and tokens[i-1:i] == ["."])):
                start = i + 3 if next3[:1] == ["."] else i + 1
                end = call_end(start)
                if end is not None:
                    add("mock-setup", i, end + 1)
        else:
            if token in {"it", "test", "describe", "fit", "fdescribe", "xit", "xtest", "xdescribe"}:
                j, modifiers = i + 1, []
                while j + 1 < len(tokens) and tokens[j] == ".":
                    modifiers.append(tokens[j + 1])
                    j += 2
                if j < len(tokens) and tokens[j] == "(":
                    name = tokens[j+1] if j+1 < len(tokens) else token
                    if token != "describe" and name.startswith(("\"", "'", "`")):
                        current = name
                        scope_end = end_at[j]
                        anchors.append(Anchor("test-declaration", json.dumps([name, tokens[j+2:scope_end+1]]),
                                              lines[i], current))
                    if set(modifiers) & {"skip", "only", "todo", "fixme", "fail"} or token.startswith(("x", "f")):
                        add("skip-or-exclusive", i, min(j + 2, end_at[j] + 1))
            if token == "expect":
                end = call_end(i + 1)
                if end is not None:
                    last, method = chain(end, tokens, call_end)
                    if last != end:
                        add(assertion_family(method), i, last + 1)
            if token == "assert" and len(next3) >= 2 and next3[0] == ".":
                end = call_end(i + 3)
                if end is not None:
                    add(assertion_family(next3[1]), i, end + 1)
            if token in {"vi","jest"} and next3[:2] in ([".","mock"], [".","doMock"], [".","spyOn"], [".","stubGlobal"]):
                end = call_end(i + 3)
                if end is not None:
                    add("mock-setup", i, end + 1)
    return anchors


def chain(end, tokens, call_end):
    methods = []
    while end + 2 < len(tokens) and tokens[end + 1] in {".", "?."}:
        methods.append(tokens[end + 2])
        following = call_end(end + 3)
        end = following if following is not None else end + 2
    return end, ".".join(methods)


def assertion_family(method: str) -> str:
    lowered = method.lower()
    if "snapshot" in lowered or "screenshot" in lowered or lowered == "verify":
        return "snapshot-assertion"
    if any(part in lowered for part in ("approx", "closeto", "tolerance", "within", "inrange")):
        return "tolerance"
    if any(part in lowered for part in ("throw", "reject", "fail", "not", "false", "never")):
        return "negative-control"
    return "assertion"


def matchkey(item: Anchor) -> tuple:
    return item.family, "" if item.family == "test-declaration" else item.key, item.test


def exact_renames(old: list[Anchor], new: list[Anchor]) -> dict[str, str]:
    old_names = {item.test for item in old if item.family == "test-declaration"}
    new_names = {item.test for item in new if item.family == "test-declaration"}
    previous, current = {}, {}
    for items, into, existing in ((old, previous, new_names), (new, current, old_names)):
        for item in items:
            if item.family == "test-declaration" and item.test not in existing:
                body = json.dumps(json.loads(item.key)[1], separators=(",", ":"))
                into.setdefault(body, []).append(item.test)
    return {values[0]: current[key][0] for key, values in previous.items()
            if len(values) == 1 and key in current and len(current[key]) == 1}


def lost(old: list[Anchor], new: list[Anchor]) -> list[Anchor]:
    kept = Counter(map(matchkey, new))
    result = []
    for item in old:
        key = matchkey(item)
        if kept[key]:
            kept[key] -= 1
        else:
            result.append(item)
    return result


def identity(signal: str, path: str, test: str | None, evidence: str, ordinal: int) -> str:
    canonical = json.dumps([signal, PurePosixPath(path).as_posix(), test, evidence, ordinal],
                           ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
