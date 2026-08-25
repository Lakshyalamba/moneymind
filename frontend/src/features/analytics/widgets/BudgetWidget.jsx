import { FaPlus } from 'react-icons/fa';
import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

export function BudgetWidget({ userBudgets, loading, error, onManageBudgets, currency, language }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="dashboard-subpanel-card loading">
        <div className="widget-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-subpanel-card error">
        <p className="error-text">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-subpanel-card">
      <div className="panel-header-btn-row">
        <h3>{t('widgets.budgetsTitle')}</h3>
        {onManageBudgets && (
          <button className="panel-header-action-btn" onClick={onManageBudgets}>
            <FaPlus /> Manage
          </button>
        )}
      </div>
      <div className="panel-content-list">
        {!userBudgets || userBudgets.length === 0 ? (
          <div className="panel-empty-state">{t('widgets.noBudgets')}</div>
        ) : (
          userBudgets.map((b) => (
            <div key={b.id || b.category} className="budget-progress-item" style={{ marginBottom: '1.25rem' }}>
              <div className="budget-item-top">
                <span className="budget-item-cat">{b.category}</span>
                <span className="budget-item-ratio">
                  {formatCurrency(b.spent, currency, language)} / <strong>{formatCurrency(b.limit, currency, language)}</strong>
                </span>
              </div>
              <div className="budget-progress-outer">
                <div 
                  className={`budget-progress-fill ${b.percentageUsed > 100 ? 'budget-over' : b.percentageUsed > 85 ? 'budget-warning' : ''}`}
                  style={{ width: `${Math.min(100, b.percentageUsed || 0)}%` }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>{(b.percentageUsed || 0).toFixed(0)}% utilized</span>
                {b.hasData ? (
                  <span style={{ 
                    color: b.projectedSpending > b.limit ? '#ef4444' : '#10b981', 
                    fontWeight: '600' 
                  }}>
                    Proj: {formatCurrency(b.projectedSpending, currency, language)}
                  </span>
                ) : (
                  <span>Forecasting: Insufficient Data</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BudgetWidget;
