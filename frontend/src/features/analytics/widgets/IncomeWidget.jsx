import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

export function IncomeWidget({ data, loading, error, currency, language }) {
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

  const { totalIncome, comparisonChange } = data;

  const renderComparison = (val) => {
    if (val === null || val === undefined) {
      return <span className="kpi-comp-neutral">No history</span>;
    }
    const isPositive = val >= 0;
    const absVal = Math.abs(val).toFixed(1);
    return (
      <span className={isPositive ? 'kpi-comp-pos' : 'kpi-comp-neg'}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />} {absVal}%
      </span>
    );
  };

  return (
    <div className="kpi-analytics-card">
      <div className="kpi-top">
        <span className="kpi-title">{t('dashboard.totalIncome')}</span>
        <span className="kpi-icon-wrapper kpi-inc"><FaArrowUp /></span>
      </div>
      <div className="kpi-value">{formatCurrency(totalIncome, currency, language)}</div>
      <div className="kpi-bottom">
        {renderComparison(comparisonChange)}
      </div>
    </div>
  );
}

export default IncomeWidget;
