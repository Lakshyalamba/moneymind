import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

export function SpendingWidget({ categoryBreakdown, loading, error, currency, language }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="chart-card-wrapper loading" style={{ minHeight: '300px' }}>
        <div className="widget-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-card-wrapper error" style={{ minHeight: '300px' }}>
        <p className="error-text">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="chart-card-wrapper">
      <h3>{t('widgets.spendingTitle')}</h3>
      <div className="chart-container-inner">
        {!categoryBreakdown || categoryBreakdown.length === 0 ? (
          <div className="chart-empty-state">{t('widgets.noTransactions')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15, 118, 110, 0.05)" />
              <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} tickFormatter={(val) => `${val}`} />
              <YAxis dataKey="category" type="category" stroke="#888" fontSize={11} width={80} tickLine={false} />
              <Tooltip formatter={(val) => formatCurrency(val, currency, language)} />
              <Bar dataKey="amount" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default SpendingWidget;
