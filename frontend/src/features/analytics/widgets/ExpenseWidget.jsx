import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

export function ExpenseWidget({ data, loading, error, currency, language }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="kpi-analytics-card loading">
        <div className="widget-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="kpi-analytics-card error">
        <p className="error-text">{t('common.error')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="kpi-analytics-card empty">
        <p className="empty-text">{t('common.noData')}</p>
      </div>
    );
  }

  const { totalExpense, comparisonChange } = data;

  const renderComparison = (val) => {
    if (val === null || val === undefined) {
      return <span className="kpi-comp-neutral">No history</span>;
    }
    const isPositive = val >= 0;
    const absVal = Math.abs(val).toFixed(1);
    // Usually expense increase is colored red (neg) and decrease is colored green (pos)
    return (
      <span className={isPositive ? 'kpi-comp-neg' : 'kpi-comp-pos'}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />} {absVal}%
      </span>
    );
  };

  return (
    <div className="kpi-analytics-card">
      <div className="kpi-top">
        <span className="kpi-title">{t('dashboard.totalExpenses')}</span>
        <span className="kpi-icon-wrapper kpi-exp"><FaArrowDown /></span>
      </div>
      <div className="kpi-value">{formatCurrency(totalExpense, currency, language)}</div>
      <div className="kpi-bottom">
        {renderComparison(comparisonChange)}
      </div>
    </div>
  );
}

export default ExpenseWidget;
