import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MigrationDashboard = ({ migrationStats }) => {
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

  console.log('MigrationDashboard: Data object created:', data);

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

  console.log('MigrationDashboard: About to return JSX');
  return (
    <div className="migration-dashboard">
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <h3>Total Processed</h3>
          <div className="stat-number">{migrationStats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Created</h3>
          <div className="stat-number created">{migrationStats.created}</div>
        </div>
        <div className="stat-card">
          <h3>Already Exists</h3>
          <div className="stat-number existed">{migrationStats.existed}</div>
        </div>
        <div className="stat-card">
          <h3>Failed</h3>
          <div className="stat-number failed">{migrationStats.failed}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Migration Breakdown</h3>
        <div className="donut-chart">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default MigrationDashboard;
