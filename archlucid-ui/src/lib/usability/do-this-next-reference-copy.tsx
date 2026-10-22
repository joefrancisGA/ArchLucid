import type React from "react";

/** Matches the on-page section heading in ReviewPackageDoThisNextStrip. */
export const DO_THIS_NEXT_SECTION_LABEL = "Do this next";

/** Bold the on-page "Do this next" section label when it appears in cross-reference copy. */
export function renderDoThisNextReferenceCopy(text: string): React.ReactNode {
  if (!text.includes(DO_THIS_NEXT_SECTION_LABEL)) {
    return text;
  }

  const parts = text.split(DO_THIS_NEXT_SECTION_LABEL);

  return parts.flatMap((part, index) => {
    if (index === 0) {
      return part.length > 0 ? [part] : [];
    }

    return [<strong key={`do-this-next-${index}`}>{DO_THIS_NEXT_SECTION_LABEL}</strong>, part];
  });
}
