import { useTranslation } from '../../../utils/LanguageContext';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export function RecentTransactionsWidget({ transactions, loading, error, currency, language }) {
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
    <div className="dashboard-subpanel-card" style={{ gridColumn: 'span 2' }}>
      <h3>{t('widgets.transactionsTitle')}</h3>
      <div className="panel-content-list" style={{ overflowX: 'auto' }}>
        {!transactions || transactions.length === 0 ? (
          <div className="panel-empty-state">{t('widgets.noTransactions')}</div>
        ) : (
          <table className="recent-tx-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Note</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{formatDate(tx.date, language)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span className="tx-cat-badge" style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {tx.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>{tx.note || '-'}</td>
                  <td style={{ 
                    padding: '0.75rem 0.5rem', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: tx.type === 'income' ? '#10b981' : '#ef4444' 
                  }}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RecentTransactionsWidget;
