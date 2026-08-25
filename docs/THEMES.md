# MoneyMind Theme Customization Guidelines

MoneyMind supports custom styling through centralized CSS design tokens defined at the root stylesheet:
`frontend/src/App.css`

---

## 1. Structure

Themes are defined as custom CSS properties inside:
- `:root` (Light Mode default settings)
- `[data-theme='dark']` (Dark Mode preferences)

```css
:root {
  --bg-color: #f7fbfb;
  --card-bg: #ffffff;
  --text-primary: #14213d;
  --text-secondary: #55616f;
  --border-color: rgba(15, 118, 110, 0.08);
}

[data-theme='dark'] {
  --bg-color: #0b0f19;
  --card-bg: #151f32;
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
  --border-color: rgba(255, 255, 255, 0.08);
}
```

---

## 2. Best Practices

- Always use variables (e.g. `var(--bg-color)`, `var(--text-primary)`) when introducing new styling or components to support theme switching dynamically.
- Do not hardcode raw colors (`#fff`, `#000`, `white`, etc.) within subcomponent stylesheets.
- Ensure that Recharts graphs use transparent backgrounds or coordinate axis styling using neutral mid-tones like `#888` which render nicely on both light and dark backgrounds.
