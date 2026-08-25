# How to Add a Dashboard Widget in MoneyMind

MoneyMind features a modular, widget-based dashboard architecture. This guide explains how to add and register a new dashboard widget.

---

## 1. Widget Component Location

All widget components reside inside the folder:
`frontend/src/features/analytics/widgets/`

---

## 2. Component Structure

Every widget should support:
- Prop-driven configuration
- Loading, Error, and Empty states
- Centralized locale translation and currency formatting

Example structure (`MyCustomWidget.jsx`):
```jsx
import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

export function MyCustomWidget({ data, loading, error, currency, language }) {
  const { t } = useTranslation();

  if (loading) {
    return <div className="widget-card loading"><div className="spinner" /></div>;
  }

  if (error) {
    return <div className="widget-card error"><p>{t('common.error')}</p></div>;
  }

  if (!data) {
    return <div className="widget-card empty"><p>{t('common.noData')}</p></div>;
  }

  return (
    <div className="widget-card">
      <h3>My Custom Metrics</h3>
      <p>{formatCurrency(data.myValue, currency, language)}</p>
    </div>
  );
}

export default MyCustomWidget;
```

---

## 3. Registration

To display your new widget on the dashboard:
1. Import the widget inside `frontend/src/features/analytics/Dashboard.jsx`:
   ```javascript
   import MyCustomWidget from './widgets/MyCustomWidget';
   ```
2. Render the widget inside the dashboard grid, passing down the unified analytics data:
   ```jsx
   <MyCustomWidget
     data={analyticsData.customMetrics}
     loading={analyticsLoading}
     error={analyticsError}
     currency={currency}
     language={language}
   />
   ```
