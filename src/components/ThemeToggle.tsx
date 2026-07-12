import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className={`theme-toggle ${className}`.trim()} onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "dark" ? "☀" : "☾"}
      </span>
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
