import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const SecretsSummary = ({ secretsSummary }) => {
  if (!secretsSummary) return null;

  // For simple count responses (like "total number of secrets is 372")
  if (secretsSummary.label) {
    return (
      <div className="secrets-summary">
        <div className="summary-stats-grid">
          <div className="summary-card main-count">
            <h3>{secretsSummary.label}</h3>
            <div className="summary-number">{secretsSummary.total}</div>
          </div>
        </div>
        
        <div className="visual-representation">
          <div className="count-display">
            <div className="count-circle">
              <span className="count-number">{secretsSummary.total}</span>
              <span className="count-label">Secrets</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For detailed breakdown (static, dynamic, unknown)
  const data = {
    labels: ['Static Secrets', 'Dynamic Secrets', 'Unknown Type'],
    datasets: [
      {
        data: [
          secretsSummary.static,
          secretsSummary.dynamic,
          secretsSummary.unknown
        ],
        backgroundColor: [
          '#3b82f6', // Blue for Static
          '#10b981', // Green for Dynamic
          '#f59e0b', // Orange for Unknown
        ],
        borderColor: [
          '#2563eb',
          '#059669',
          '#d97706'
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <div className="secrets-summary">
      <div className="summary-stats-grid">
        <div className="summary-card">
          <h3>Total Secrets</h3>
          <div className="summary-number">{secretsSummary.total}</div>
        </div>
        <div className="summary-card">
          <h3>Static</h3>
          <div className="summary-number static">{secretsSummary.static}</div>
        </div>
        <div className="summary-card">
          <h3>Dynamic</h3>
          <div className="summary-number dynamic">{secretsSummary.dynamic}</div>
        </div>
        <div className="summary-card">
          <h3>Unknown</h3>
          <div className="summary-number unknown">{secretsSummary.unknown}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Secrets Breakdown</h3>
        <div className="donut-chart">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default SecretsSummary;
