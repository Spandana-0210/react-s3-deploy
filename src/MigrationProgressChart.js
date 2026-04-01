import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MigrationProgressChart = ({ migrationStats }) => {
  if (!migrationStats) return null;

  const data = {
    labels: ['Created', 'Already Exists', 'Failed', 'Skipped'],
    datasets: [
      {
        data: [
          migrationStats.created,
          migrationStats.existed,
          migrationStats.failed,
          migrationStats.skipped
        ],
        backgroundColor: [
          '#10b981', // Green for Created
          '#3b82f6', // Blue for Already Exists
          '#ef4444', // Red for Failed
          '#f59e0b', // Orange for Skipped
        ],
        borderColor: [
          '#059669',
          '#2563eb',
          '#dc2626',
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
          padding: 15,
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="migration-progress-chart">
      <h3>Migration Progress</h3>
      <div className="chart-info">
        <div className="progress-summary">
          <div className="progress-item">
            <span className="label">Progress:</span>
            <span className="value">100% ({migrationStats.total} secrets)</span>
          </div>
          <div className="progress-item">
            <span className="label">Time Remaining:</span>
            <span className="value">0 seconds</span>
          </div>
          <div className="progress-item">
            <span className="label">Status:</span>
            <span className="value completed">Completed</span>
          </div>
        </div>
      </div>
      <div className="pie-chart-container">
        <Pie data={data} options={options} />
      </div>
      <div className="breakdown-stats">
        <div className="stat-row">
          <div className="stat-item created">
            <div className="stat-dot"></div>
            <span>Created: {migrationStats.created}</span>
          </div>
          <div className="stat-item existed">
            <div className="stat-dot"></div>
            <span>Already Exists: {migrationStats.existed}</span>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-item failed">
            <div className="stat-dot"></div>
            <span>Failed: {migrationStats.failed}</span>
          </div>
          <div className="stat-item skipped">
            <div className="stat-dot"></div>
            <span>Skipped: {migrationStats.skipped}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationProgressChart;
