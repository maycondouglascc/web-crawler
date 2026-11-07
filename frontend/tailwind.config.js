/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        sunken: "var(--color-sunken)",
        surface: "var(--color-surface)",
        chip: "var(--color-chip)",
        media: "var(--color-media)",
        "overlay-surface": "var(--color-overlay-surface)",
        hover: "var(--color-hover)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        subtle: "var(--color-subtle)",
        line: "var(--color-line)",
        "line-strong": "var(--color-line-strong)",
        action: "var(--color-action)",
        "action-hover": "var(--color-action-hover)",
        danger: "var(--color-danger)",
        "danger-muted": "var(--color-danger-muted)",
      },
      fontFamily: {
        sans: ["Geist Sans", "Geist", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "40px" }],
        body: ["16px", { lineHeight: "24px" }],
        label: ["13px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px" }],
      },
      borderRadius: {
        control: "12px",
        card: "24px",
      },
      spacing: {
        2.5: "10px",
      },
      maxWidth: {
        page: "1440px",
      },
    },
  },
  plugins: [],
};
