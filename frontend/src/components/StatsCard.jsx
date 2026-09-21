/**
 * Stats Card Component
 * Displays key telemetry metrics with clear titles, large numerical values,
 * intuitive status indicators, and contextual descriptions.
 */

export default function StatsCard({
  icon,
  value,
  title,
  label,
  change,
  subtitle,
  trend = 'neutral',
  trendDir,
  color = 'blue',
}) {
  const cardTitle = title || label || 'Metric';
  const description = change || subtitle || '';

  // Determine indicator direction
  const direction = trendDir || (trend === 'up' || trend === 'down' ? trend : 'neutral');

  return (
    <div className="glass-card stat-card animate-fade-in">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-label">{cardTitle}</div>
        <div className="stat-value">{value}</div>
        {description && (
          <div className={`stat-trend ${direction}`}>
            {direction === 'up' && <span className="stat-arrow">↑</span>}
            {direction === 'down' && <span className="stat-arrow">↓</span>}
            {direction === 'neutral' && <span className="stat-dot">●</span>}
            <span>{description}</span>
          </div>
        )}
      </div>
    </div>
  );
}
