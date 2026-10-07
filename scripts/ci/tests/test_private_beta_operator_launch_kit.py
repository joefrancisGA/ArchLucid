from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
KIT_PATH = REPOSITORY_ROOT / "docs" / "runbooks" / "PRIVATE_BETA_OPERATOR_LAUNCH_KIT.md"


def test_private_beta_operator_kit_exists_and_covers_the_cut_contract() -> None:
    content = KIT_PATH.read_text(encoding="utf-8")

    required_sections = (
        "## Cut definition",
        "## Go / no-go preflight",
        "## Access recovery checks",
        "## Spend, rollback, and offboarding",
        "## Cost, abuse, and capacity review",
        "## On-call observability",
        "## First-week support loop",
        "## Claim and data-handling gate",
        "## Cut-freeze rule",
        "## Evidence record",
    )

    for section in required_sections:
        assert section in content

    for marker in (
        "Expired invitation",
        "Expired session",
        "Wrong tenant",
        "Missing role",
        "Dead review deep link",
        "correlationId",
        "runId",
        "AgentExecution__Mode=Simulator",
        "AnonymousExecutionEnabled=false",
        "Do not imply CPA SOC",
        "third-party pen test",
        "Simulator output is Real proof",
    ):
        assert marker in content


def test_private_beta_operator_kit_links_only_existing_runbooks() -> None:
    content = KIT_PATH.read_text(encoding="utf-8")
    linked_paths = []

    for line in content.splitlines():
        cursor = 0
        while True:
            start = line.find("](", cursor)
            if start == -1:
                break

            end = line.find(")", start)
            assert end != -1, f"Unclosed Markdown link in line: {line}"
            linked_paths.append(line[start + 2 : end].split("#", 1)[0])
            cursor = end + 1

    for linked_path in linked_paths:
        assert linked_path and not linked_path.startswith(("http://", "https://"))
        assert (KIT_PATH.parent / linked_path).resolve().exists(), linked_path
