import type { JSX } from "react";

import type { VocabularyRailNote } from "@/components/vocabulary/vocabulary-rail-types";

/** Renders a vocabulary rail note; optional {@link VocabularyRailNote.boldPrefix} is semibold. */
export function VocabularyRailNoteText(props: { readonly note: VocabularyRailNote }): JSX.Element {
  const boldPrefix = props.note.boldPrefix;

  if (typeof boldPrefix === "string" && boldPrefix.length > 0) {
    return (
      <>
        <span className="font-semibold text-al-text-primary">{boldPrefix}</span>
        {" "}
        {props.note.text}
      </>
    );
  }

  return <>{props.note.text}</>;
}
