# Adding Locales and Custom Localized Formatting in MoneyMind

MoneyMind supports internationalization (`i18n`) and localized numbers/currency.

---

## 1. Dictionaries

All static page string translations are located in:
`frontend/src/locales/`

To add a new language (e.g. Spanish `es`):
1. Create `es.json` inside `frontend/src/locales/`.
2. Add your translation keys mirroring `en.json`.
3. Open `frontend/src/utils/LanguageContext.jsx` and import the dictionary:
   ```javascript
   import esTranslations from '../locales/es.json';
   ```
4. Add it to the registry map:
   ```javascript
   const dictionaries = {
     en: enTranslations,
     hi: hiTranslations,
     es: esTranslations
   };
   ```

---

## 2. Using Translations in Components

Use the `useTranslation()` hook in your React component:
```jsx
import { useTranslation } from '../../utils/LanguageContext';

export function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('common.welcome', { name: 'User' })}</p>;
}
```

---

## 3. Localized Formatting

Always format date and currency using the central formatting library:
`frontend/src/utils/formatters.js`

```javascript
import { formatCurrency, formatDate } from '../../utils/formatters';

const currencyFormatted = formatCurrency(5000, 'USD', 'en'); // "$5,000.00"
const dateFormatted = formatDate('2026-08-25', 'hi'); // "25/8/2026"
```
