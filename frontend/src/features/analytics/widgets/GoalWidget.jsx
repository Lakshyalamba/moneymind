import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export function GoalWidget({ goalProgress, loading, error, currency, language }) {
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
      <h3>{t('widgets.goalsTitle')}</h3>
      <div className="panel-content-list">
        {!goalProgress || goalProgress.length === 0 ? (
          <div className="panel-empty-state">{t('widgets.noGoals')}</div>
        ) : (
          goalProgress.map((g) => (
            <div key={g.id || g.title} className="goal-progress-item" style={{ marginBottom: '1.25rem' }}>
              <div className="goal-item-top">
                <span className="goal-item-title">{g.title}</span>
                <span className="goal-item-ratio">
                  {formatCurrency(g.currentAmount, currency, language)} / <strong>{formatCurrency(g.targetAmount, currency, language)}</strong>
                </span>
              </div>
              <div className="goal-progress-outer">
                <div 
                  className="goal-progress-fill"
                  style={{ width: `${Math.min(100, g.percentage || 0)}%` }}
                />
              </div>
              <div className="goal-item-bottom" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>Deadline: {formatDate(g.deadline, language)}</span>
                <span>{(g.percentage || 0).toFixed(0)}% saved</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GoalWidget;
