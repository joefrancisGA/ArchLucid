"""Draft-PDF builder for the book. Entry point: ``docs/book/tools/build_book_pdf.py``.

Modules that need ``reportlab`` (fonts, styles, renderer, document, builder) are imported
only by the builder, so ``sources``, ``code_wrap``, and ``tables`` stay usable without it.
"""
