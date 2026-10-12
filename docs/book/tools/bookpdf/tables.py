"""Column widths for book tables, sized by content instead of split evenly."""

from __future__ import annotations

MIN_SHARE = 0.10
MAX_SHARE = 0.60
# Rough width of one character in the table cell font (Times 8.6 pt bold), plus cell padding, in points.
CHAR_WIDTH = 4.7
CELL_PADDING = 10.0


def _content_weight(column: list[str]) -> float:
    """A column's appetite for width: its longest cell, with a floor so empty columns stay visible."""
    return float(max([len(cell or "") for cell in column] + [3]))


def _longest_word(column: list[str]) -> int:
    return max([len(word) for cell in column for word in (cell or "").split()] + [1])


def _bounded_shares(weights: list[float], lows: list[float], high: float) -> list[float]:
    """Shares proportional to ``weights``, each clamped to [lows[i], high], summing to 1.

    Water-filling: pin the columns that exceed the maximum (or, once none do, those under their
    minimum), share what is left among the rest in proportion to their weights, and repeat.
    """
    shares: list[float | None] = [None] * len(weights)

    for _ in range(len(weights) + 1):
        free = [i for i, share in enumerate(shares) if share is None]

        if not free:
            break

        left = 1.0 - sum(share for share in shares if share is not None)
        total = sum(weights[i] for i in free)
        proposal = {i: left * weights[i] / total for i in free}
        over = {i: high for i, value in proposal.items() if value > high}
        under = {i: lows[i] for i, value in proposal.items() if value < lows[i]}
        pinned = over or under

        if not pinned:
            return [share if share is not None else proposal[i] for i, share in enumerate(shares)]

        for i, value in pinned.items():
            shares[i] = value

    return _spread_leftover([share if share is not None else lows[i] for i, share in enumerate(shares)], lows, high)


def _spread_leftover(shares: list[float], lows: list[float], high: float) -> list[float]:
    """Make pinned shares sum to 1 by moving width only where a column's bounds allow it."""
    leftover = 1.0 - sum(shares)
    room = [high - share for share in shares] if leftover > 0 else [share - low for share, low in zip(shares, lows)]
    capacity = sum(room)

    if capacity <= 0 or abs(leftover) > capacity:
        return [share / sum(shares) for share in shares]

    return [share + leftover * slack / capacity for share, slack in zip(shares, room)]


def column_widths(
    rows: list[list[str]],
    total_width: float,
    min_share: float = MIN_SHARE,
    max_share: float = MAX_SHARE,
) -> list[float]:
    """Widths for each column of ``rows`` (plain-text cells), summing to ``total_width``.

    Each column gets at least ``min_share`` of the width, or enough for its longest word if that is
    more, so words aren't split mid-way; no column gets more than ``max_share``.
    """
    if not rows or not rows[0] or total_width <= 0:
        return []

    count = max(len(row) for row in rows)
    padded = [row + [""] * (count - len(row)) for row in rows]
    columns = [[row[i] for row in padded] for i in range(count)]
    high = max(max_share, 1.0 / count)
    base_low = min(min_share, 1.0 / count)
    word_lows = [(_longest_word(column) * CHAR_WIDTH + CELL_PADDING) / total_width for column in columns]
    lows = [min(max(base_low, word_low), high) for word_low in word_lows]

    # If the word floors alone overflow the table, fall back to the plain minimum share.
    if sum(lows) > 1.0:
        lows = [base_low] * count

    shares = _bounded_shares([_content_weight(column) for column in columns], lows, high)

    return [share * total_width for share in shares]
