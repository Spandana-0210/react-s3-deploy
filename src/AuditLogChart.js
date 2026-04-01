import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AuditLogChart = ({ auditData }) => {
  if (!auditData) return null;

  const data = {
    labels: ['Total Attempted', 'Processed Count', 'Created Count', 'Already Exists', 'Failed Count'],
    datasets: [
      {
        label: 'Count',
        data: [
          auditData.total_attempted || 0,
          auditData.processed_count || 0,
          auditData.created_count || 0,
          auditData.already_exists_count || 0,
          auditData.failed_count || 0
        ],
        backgroundColor: [
          '#8b5cf6', // Purple for Total Attempted
          '#06b6d4', // Cyan for Processed Count
          '#10b981', // Green for Created Count
          '#3b82f6', // Blue for Already Exists
          '#ef4444', // Red for Failed Count
        ],
        borderColor: [
          '#7c3aed',
          '#0891b2',
          '#059669',
          '#2563eb',
          '#dc2626'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Audit Log Statistics',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  return (
    <div className="audit-log-chart">
      <h3>Audit Log Record (DynamoDB)</h3>
      
      {/* Batch Info Card */}
      <div className="batch-info-card">
        <div className="info-row">
          <span className="label">Batch ID:</span>
          <span className="value batch-id">{auditData.batch_id}</span>
        </div>
        <div className="info-row">
          <span className="label">Status:</span>
          <span className="value status completed">{auditData.status}</span>
        </div>
        <div className="info-row">
          <span className="label">TTL:</span>
          <span className="value ttl">{auditData.ttl}</span>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="timeline-card">
        <h4>Timeline</h4>
        <div className="timeline-info">
          <div className="time-row">
            <span className="label">Started:</span>
            <span className="value">{new Date(auditData.start_time).toLocaleString()}</span>
          </div>
          <div className="time-row">
            <span className="label">Finished:</span>
            <span className="value">{new Date(auditData.end_time).toLocaleString()}</span>
          </div>
          <div className="time-row">
            <span className="label">Duration:</span>
            <span className="value">
              {Math.round((new Date(auditData.end_time) - new Date(auditData.start_time)) / 1000)}s
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bar-chart-container">
        <Bar data={data} options={options} />
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-number">{auditData.total_attempted}</div>
          <div className="stat-label">Total Attempted</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon">⚡</div>
          <div className="stat-number">{auditData.processed_count}</div>
          <div className="stat-label">Processed</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-number">{auditData.created_count}</div>
          <div className="stat-label">Created</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🔄</div>
          <div className="stat-number">{auditData.already_exists_count}</div>
          <div className="stat-label">Already Exists</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogChart;
