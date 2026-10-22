"""One-shot repair: dedupe TB-071-078 and renumber commercial TB-114-120 to TB-170-176."""
from pathlib import Path


def main() -> None:
    path = Path("docs/library/TECH_BACKLOG.md")
    text = path.read_text(encoding="utf-8")

    marker = "## TB-071 — Azure Search production client"
    first = text.find(marker)
    second = text.find(marker, first + 1)
    if second == -1:
        raise SystemExit("No duplicate TB-071 block found")

    marker79 = "## TB-079 — ADO PR markdown"
    end = text.find(marker79, second)
    if end == -1:
        raise SystemExit("TB-079 anchor not found after duplicate")

    text = text[:second] + text[end:]

    design = "## TB-114 — Establish enterprise design-token"
    if text.find(design) == -1:
        raise SystemExit("Design-system TB-114 not found")

    commercial_start = text.find("## TB-114 — Accelerator chooser")
    commercial_end = text.find("## TB-121 — Route/tier/policy", commercial_start)
    if commercial_start == -1 or commercial_end == -1:
        raise SystemExit("Commercial cluster boundaries not found")

    head = text[:commercial_start]
    commercial = text[commercial_start:commercial_end]
    tail = text[commercial_end:]

    temp_map = {
        "TB-114": "TB-9TEMP114",
        "TB-115": "TB-9TEMP115",
        "TB-116": "TB-9TEMP116",
        "TB-117": "TB-9TEMP117",
        "TB-118": "TB-9TEMP118",
        "TB-119": "TB-9TEMP119",
        "TB-120": "TB-9TEMP120",
    }
    final_map = {
        "TB-9TEMP114": "TB-170",
        "TB-9TEMP115": "TB-171",
        "TB-9TEMP116": "TB-172",
        "TB-9TEMP117": "TB-173",
        "TB-9TEMP118": "TB-174",
        "TB-9TEMP119": "TB-175",
        "TB-9TEMP120": "TB-176",
    }

    for old, temp in temp_map.items():
        commercial = commercial.replace(old, temp)

    for temp, new in final_map.items():
        commercial = commercial.replace(temp, new)

    for tb in range(170, 177):
        hdr = f"## TB-{tb} —"
        idx = commercial.find(hdr)
        if idx == -1:
            continue

        line_end = commercial.find("\n", idx)
        next_line_start = line_end + 1

        if commercial[next_line_start : next_line_start + 11] != "**Status:**":
            commercial = (
                commercial[:next_line_start]
                + "**Status:** **Open** (renumbered from legacy TB-114–120 commercial cluster; design-system TB-114–120 remain **Done**).\n\n"
                + commercial[next_line_start:]
            )

    text = head + commercial + tail

    intro_end = text.find("---\n\n## TB-009")
    intro = text[:intro_end]
    body = text[intro_end:]

    intro = intro.replace(
        "**TB-114 – TB-118** were added 2026-05-29 from a Template and Accelerator Richness review.",
        "**TB-170 – TB-176** (formerly duplicated IDs TB-114–120 in this file) were added 2026-05-29 from a Template and Accelerator Richness review.",
    )
    intro = intro.replace("**TB-114** is the highest leverage", "**TB-170** is the highest leverage")
    intro = intro.replace("**TB-115** prevents", "**TB-171** prevents")
    intro = intro.replace("**TB-116** and **TB-117**", "**TB-172** and **TB-173**")
    intro = intro.replace("**TB-118** creates", "**TB-174** creates")

    table_rows = [
        ("| TB-114 | Accelerator chooser", "| TB-170 | Accelerator chooser"),
        ("| TB-115 | Starter proof pack metadata", "| TB-171 | Starter proof pack metadata"),
        ("| TB-116 | Starter proof pack static validation", "| TB-172 | Starter proof pack static validation"),
        ("| TB-117 | Template-to-proof dry-run", "| TB-173 | Template-to-proof dry-run"),
        ("| TB-118 | Golden accelerator walkthrough", "| TB-174 | Golden accelerator walkthrough"),
        ("| TB-119 | Policy pack metadata", "| TB-175 | Policy pack metadata"),
        ("| TB-120 | Policy pack dry-run index", "| TB-176 | Policy pack dry-run index"),
    ]

    for old, new in table_rows:
        intro = intro.replace(old, new)

    text = intro + body
    path.write_text(text, encoding="utf-8", newline="\n")
    print("OK: deduped TB-071-078; renumbered commercial TB-114-120 -> TB-170-176")


if __name__ == "__main__":
    main()
