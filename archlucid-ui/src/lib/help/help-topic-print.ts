export function printHelpTopicPage(): void {
  if (typeof window === "undefined") {
    throw new Error("printHelpTopicPage is only supported in the browser.");
  }

  window.print();
}
