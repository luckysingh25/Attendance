module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#7C3AED",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#1E293B",
        textMuted: "#64748B",
        success: "#10B981",
        danger: "#EF4444",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
}
