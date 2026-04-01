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

const AuditLogDashboard = ({ auditData }) => {
  if (!auditData) return null;

  // Calculate duration
  const startTime = new Date(auditData.start_time);
  const endTime = new Date(auditData.end_time);
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Chart data for counts
  const chartData = {
    labels: ['Total Attempted', 'Processed', 'Created', 'Already Exists', 'Failed'],
    datasets: [
      {
        label: 'Count',
        data: [
          auditData.total_attempted,
          auditData.processed_count,
          auditData.created_count,
          auditData.already_exists_count,
          auditData.failed_count
        ],
        backgroundColor: [
          '#3b82f6', // Blue for Total
          '#8b5cf6', // Purple for Processed
          '#10b981', // Green for Created
          '#f59e0b', // Orange for Already Exists
          '#ef4444', // Red for Failed
        ],
        borderColor: [
          '#2563eb',
          '#7c3aed',
          '#059669',
          '#d97706',
          '#dc2626'
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="audit-log-dashboard">
      <div className="audit-header">
        <div className="audit-batch-info">
          <h3>Batch Information</h3>
          <div className="batch-id">
            <span className="label">Batch ID:</span>
            <span className="value">{auditData.batch_id}</span>
          </div>
          <div className="status-badge">
            <span className={`status ${auditData.status.toLowerCase()}`}>
              {auditData.status}
            </span>
          </div>
        </div>
        
        <div className="audit-timing">
          <h3>Timing Information</h3>
          <div className="timing-grid">
            <div className="timing-item">
              <span className="label">Started:</span>
              <span className="value">{formatDateTime(auditData.start_time)}</span>
            </div>
            <div className="timing-item">
              <span className="label">Finished:</span>
              <span className="value">{formatDateTime(auditData.end_time)}</span>
            </div>
            <div className="timing-item">
              <span className="label">Duration:</span>
              <span className="value highlight">{duration}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="audit-stats">
        <h3>Processing Statistics</h3>
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="audit-details">
        <h3>Additional Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Sort Key:</span>
            <span className="value">{auditData.sort_key}</span>
          </div>
          <div className="detail-item">
            <span className="label">Updated At:</span>
            <span className="value">{formatDateTime(auditData.updated_at)}</span>
          </div>
          <div className="detail-item">
            <span className="label">TTL:</span>
            <span className="value">{auditData.ttl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDashboard;
