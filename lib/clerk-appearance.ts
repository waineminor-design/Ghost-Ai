import { dark } from "@clerk/ui/themes";

// Clerk's dark theme, re-pointed at the design tokens in app/globals.css.
// Fonts use the loaded Geist variables because `@theme inline` does not emit
// `--font-sans` / `--font-mono` at runtime.
export const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorDanger: "var(--destructive)",
    colorForeground: "var(--foreground)",
    colorMuted: "var(--muted)",
    colorMutedForeground: "var(--muted-foreground)",
    colorBackground: "var(--popover)",
    colorInput: "var(--background)",
    colorInputForeground: "var(--foreground)",
    colorBorder: "var(--border)",
    colorRing: "var(--ring)",
    fontFamily: "var(--font-geist-sans)",
    fontFamilyButtons: "var(--font-geist-sans)",
    fontFamilyMono: "var(--font-geist-mono)",
    borderRadius: "var(--radius)",
  },
};

// Sign-in / sign-up forms sit directly on the page background, not in a card.
export const authFormAppearance = {
  elements: {
    cardBox: { boxShadow: "none", border: "none" },
    card: { backgroundColor: "var(--background)", boxShadow: "none" },
    footer: { background: "var(--background)" },
  },
};
