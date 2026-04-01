// src/App.js
import { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import MigrationDashboard from './MigrationDashboard';
import AuditLogDashboard from './AuditLogDashboard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import './App.css';

// Register Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logLink, setLogLink] = useState(null);
  const [migrationStats, setMigrationStats] = useState(null); // New state for migration statistics
  const [auditLogData, setAuditLogData] = useState(null); // New state for audit log data
  const [responseTimes, setResponseTimes] = useState([]);

  // Hardcoded URLs
  const API_URL = 'https://myyu6tghcca7tduwhanx5wb6ue0xtsqv.lambda-url.us-east-1.on.aws/';
  const LOG_FETCH_URL = 'https://x5knssmhmnvggezuredbe5i2qi0pqxqz.lambda-url.us-east-1.on.aws/';

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-IN');
    setLogs(prev => [...prev.slice(-40), { time, message, type }]); // keep last 40 logs
  };

  // --- UPDATED handleAsk WITH POLLING ---
  const handleAsk = async () => {
    if (prompt.trim() === '') {
      alert('Please enter a prompt!');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse('');
    setLogLink(null);
    addLog(`Initiating Request: ${prompt.substring(0, 70)}...`);

    const startTime = Date.now();

    try {
      // 1. DISPATCH: Send request to Lambda 1
      const res = await axios.post(API_URL, {
        prompt: prompt,
        type: 'DEFAULT'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { jobId } = res.data;
      addLog(`Job dispatched successfully. ID: ${jobId}`, 'info');

      // 2. POLL: Check status every 5 seconds
      const pollInterval = setInterval(async () => {
        try {
          addLog(`Checking status for job: ${jobId}...`);
          // Note: Lambda 1 needs to handle this GET request to query DynamoDB
          const statusRes = await axios.get(`${API_URL}?jobId=${jobId}`);
          const jobData = statusRes.data;

          if (jobData.status === 'COMPLETED') {
            clearInterval(pollInterval);
            
            const endTime = Date.now();
            const responseTime = ((endTime - startTime) / 1000).toFixed(2);
            setResponseTimes(prev => [...prev.slice(-9), parseFloat(responseTime)]);

            const answer = jobData.answer || 'No answer received from backend';
            setResponse(answer);
            addLog(`Success – response received in ${responseTime}s`, 'success');
            
            // Re-run your existing parsing logic on the final answer
            parseResponseData(answer);
            setLoading(false);
          } 
          else if (jobData.status === 'FAILED') {
            clearInterval(pollInterval);
            setError(jobData.error || "Backend migration failed.");
            addLog(`Error: Job failed on backend`, 'error');
            setLoading(false);
          }
          // If status is 'PROCESSING', do nothing and wait for next interval
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 5000);

      // Fetch Log Link (Existing logic)
      try {
        const linkRes = await axios.get(LOG_FETCH_URL);
        if (linkRes.data?.logLink) {
          setLogLink(linkRes.data.logLink);
        }
      } catch (linkErr) {
        console.error("Failed to fetch log link", linkErr);
      }

    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      addLog(`Error: ${msg}`, 'error');
    }
  };

  // HELPER: Extracted your existing parsing logic to be reusable
  const parseResponseData = (answer) => {
      // Parse migration statistics from the answer
      const createdMatch = answer.match(/• Created: (\d+)/);
      const existedMatch = answer.match(/• Already Exists: (\d+)/);
      const failedMatch = answer.match(/• Failed: (\d+)/);
      const skippedMatch = answer.match(/• Skipped: (\d+)/);
      const progressMatch = answer.match(/Progress: \d+\.?\d*% \((\d+) \/ (\d+) secrets\)/);

      // Parse audit log data
      const auditLogSection = answer.match(/Audit Log Record \(DynamoDB Raw Columns\)[\s\S]*?(?=\n\n|\n$|$)/);
      let auditData = null;
      
      if (auditLogSection) {
        const auditText = auditLogSection[0];
        const batchIdMatch = auditText.match(/batch_id\s*\t\s*([^\n]+)/) || auditText.match(/batch_id\s*\|\s*([^\n]+)/);
        const sortKeyMatch = auditText.match(/sort_key\s*\t\s*([^\n]+)/) || auditText.match(/sort_key\s*\|\s*([^\n]+)/);
        const statusMatch = auditText.match(/status\s*\t\s*([^\n]+)/) || auditText.match(/status\s*\|\s*([^\n]+)/);
        const startTimeMatch = auditText.match(/start_time\s*\t\s*([^\n]+)/) || auditText.match(/start_time\s*\|\s*([^\n]+)/);
        const endTimeMatch = auditText.match(/end_time\s*\t\s*([^\n]+)/) || auditText.match(/end_time\s*\|\s*([^\n]+)/);
        const updatedAtMatch = auditText.match(/updated_at\s*\t\s*([^\n]+)/) || auditText.match(/updated_at\s*\|\s*([^\n]+)/);
        const totalAttemptedMatch = auditText.match(/total_attempted\s*\t\s*([^\n]+)/) || auditText.match(/total_attempted\s*\|\s*([^\n]+)/);
        const processedCountMatch = auditText.match(/processed_count\s*\t\s*([^\n]+)/) || auditText.match(/processed_count\s*\|\s*([^\n]+)/);
        const createdCountMatch = auditText.match(/created_count\s*\t\s*([^\n]+)/) || auditText.match(/created_count\s*\|\s*([^\n]+)/);
        const alreadyExistsCountMatch = auditText.match(/already_exists_count\s*\t\s*([^\n]+)/) || auditText.match(/already_exists_count\s*\|\s*([^\n]+)/);
        const failedCountMatch = auditText.match(/failed_count\s*\t\s*([^\n]+)/) || auditText.match(/failed_count\s*\|\s*([^\n]+)/);
        const ttlMatch = auditText.match(/ttl\s*\t\s*([^\n]+)/) || auditText.match(/ttl\s*\|\s*([^\n]+)/);

        if (batchIdMatch && statusMatch && startTimeMatch && endTimeMatch) {
          auditData = {
            batch_id: batchIdMatch[1].trim(),
            sort_key: sortKeyMatch ? sortKeyMatch[1].trim() : '',
            status: statusMatch[1].trim(),
            start_time: startTimeMatch[1].trim(),
            end_time: endTimeMatch[1].trim(),
            updated_at: updatedAtMatch ? updatedAtMatch[1].trim() : '',
            total_attempted: totalAttemptedMatch ? parseInt(totalAttemptedMatch[1].trim()) : 0,
            processed_count: processedCountMatch ? parseInt(processedCountMatch[1].trim()) : 0,
            created_count: createdCountMatch ? parseInt(createdCountMatch[1].trim()) : 0,
            already_exists_count: alreadyExistsCountMatch ? parseInt(alreadyExistsCountMatch[1].trim()) : 0,
            failed_count: failedCountMatch ? parseInt(failedCountMatch[1].trim()) : 0,
            ttl: ttlMatch ? ttlMatch[1].trim() : ''
          };
        }
      }

      if (createdMatch && existedMatch && failedMatch && skippedMatch && progressMatch) {
        setMigrationStats({
          total: parseInt(progressMatch[2]),
          created: parseInt(createdMatch[1]),
          existed: parseInt(existedMatch[1]),
          failed: parseInt(failedMatch[1]),
          skipped: parseInt(skippedMatch[1]),
        });
        addLog(`Stats parsed successfully`, 'success');
      }

      if (auditData) {
        setAuditLogData(auditData);
      }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <img src="/teksystems_logo.png" alt="TEKsystems" className="header-logo" />
        </div>
        <div className="batch-info">
          <span className="batch-size-text">MAXIMUM BATCH SECRETS = 500</span>
        </div>
        <h1>UMA Secret Manager Migration</h1>
        {logLink && (
          <div className="floating-log-button">
            <a 
              href={logLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="log-button"
            >
              View AWS CloudWatch Logs ↗
            </a>
          </div>
        )}
      </header>

      <main className="dashboard">
        <section className="card input-card">
          <h2>Ask your agent</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question here..."
            rows={5}
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading || prompt.trim() === ''}
            className={loading ? 'loading' : ''}
          >
            {loading ? 'Thinking...' : 'Send Prompt'}
          </button>

          {error && <div className="error-box">{error}</div>}
        </section>

        <section className="card console-card">
          <h2>Console / Activity Log</h2>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="logs-empty">No activity yet...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={`log-item ${log.type}`}>
                  <span className="log-time">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </section>

        {auditLogData && (
          <section className="card audit-log-card">
            <h2>Audit Log Record</h2>
            <AuditLogDashboard auditData={auditLogData} />
          </section>
        )}

        {migrationStats && (
          <section className="card progress-card">
            <h2>Migration Progress</h2>
            <div className="progress-container">
              <div className="progress-item">
                <div className="progress-label">
                  <span>Created</span>
                  <span className="progress-count">{migrationStats.created}/{migrationStats.total}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill created"
                    style={{ width: `${(migrationStats.created / migrationStats.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span>Already Existed</span>
                  <span className="progress-count">{migrationStats.existed}/{migrationStats.total}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill existed"
                    style={{ width: `${(migrationStats.existed / migrationStats.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span>Failed</span>
                  <span className="progress-count">{migrationStats.failed}/{migrationStats.total}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill failed"
                    style={{ width: `${(migrationStats.failed / migrationStats.total) * 100}%` }}
                  />
                </div>
              </div>

              {migrationStats.skipped > 0 && (
                <div className="progress-item">
                  <div className="progress-label">
                    <span>Skipped</span>
                    <span className="progress-count">{migrationStats.skipped}/{migrationStats.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill skipped"
                      style={{ width: `${(migrationStats.skipped / migrationStats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {migrationStats ? (
          <div className="response-chart-container">
            <section className="card response-card">
              <h2>Response</h2>
              <div className="response-content">
                {response || (loading ? 'Waiting for Bedrock...' : 'Answer will appear here')}
              </div>
            </section>

            <section className="card pie-chart-card">
              <h2>Migration Breakdown</h2>
              <div className="pie-chart-container">
                <MigrationDashboard migrationStats={migrationStats} />
              </div>
            </section>

            <section className="card migration-stats-card">
              <h2>Migration Statistics</h2>
              <div className="migration-stats-content">
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Processed</span>
                    <span className="stat-value">{migrationStats.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Created</span>
                    <span className="stat-value created">{migrationStats.created}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Already Exists</span>
                    <span className="stat-value existed">{migrationStats.existed}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Failed</span>
                    <span className="stat-value failed">{migrationStats.failed}</span>
                  </div>
                  {migrationStats.skipped > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Skipped</span>
                      <span className="stat-value skipped">{migrationStats.skipped}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {responseTimes.length > 0 && (
              <section className="card response-time-card">
                <h2>Response Times</h2>
                <div className="response-time-chart">
                  <Line
                    data={{
                      labels: responseTimes.map((_, index) => `Call ${index + 1}`),
                      datasets: [
                        {
                          label: 'Response Time (seconds)',
                          data: responseTimes,
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.parsed.y}s`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { display: false }
                        },
                        x: {
                          grid: { display: false }
                        }
                      }
                    }}
                  />
                </div>
              </section>
            )}
          </div>
        ) : (
          <section className="card response-card">
            <h2>Response</h2>
            <div className="response-content">
              {response || (loading ? 'Waiting for Bedrock...' : 'Answer will appear here')}
            </div>
          </section>
        )}

        </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="copyright-text">
            <span>© 2026 TEKsystems, Inc. ALL RIGHTS RESERVED.</span>
            <span>© 2026 TEKsystems Global Services, LLC ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;







// // src/App.js
// import { useState } from 'react';
// import axios from 'axios';
// import { Line } from 'react-chartjs-2';
// import MigrationDashboard from './MigrationDashboard';
// import AuditLogDashboard from './AuditLogDashboard';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// import './App.css';

// // Register Chart.js components once
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// function App() {
//   const [prompt, setPrompt] = useState('');
//   const [response, setResponse] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [logs, setLogs] = useState([]);
//   const [logLink, setLogLink] = useState(null);
//   const [migrationStats, setMigrationStats] = useState(null); // New state for migration statistics
//   const [auditLogData, setAuditLogData] = useState(null); // New state for audit log data
//   const [responseTimes, setResponseTimes] = useState([]);

//   // Hardcoded URLs
//   const API_URL = 'https://4cpi3amvh4s7hzhqimm4lcq55y0veqdl.lambda-url.us-east-1.on.aws/';
//   const LOG_FETCH_URL = 'https://qbvqgxuqmpwbu3ptrk2umuj3uu0gkmbv.lambda-url.us-east-1.on.aws/';

//   const addLog = (message, type = 'info') => {
//     const time = new Date().toLocaleTimeString('en-IN');
//     setLogs(prev => [...prev.slice(-40), { time, message, type }]); // keep last 40 logs
//   };

//   const handleAsk = async () => {
//     if (prompt.trim() === '') {
//       alert('Please enter a prompt!');
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     setResponse('');
//     setLogLink(null); // Reset link for new request
//     addLog(`Sending: ${prompt.substring(0, 70)}${prompt.length > 70 ? '...' : ''}`);

//     const startTime = Date.now();

//     try {
//       const res = await axios.post(API_URL, {
//         prompt: prompt,
//         type: 'DEFAULT'
//       }, {
//         headers: { 'Content-Type': 'application/json' },
//         timeout: 300000, 
//       });

//       const endTime = Date.now();
//       const responseTime = ((endTime - startTime) / 1000).toFixed(2);
      
//       setResponseTimes(prev => [...prev.slice(-9), parseFloat(responseTime)]); 
      
//       const answer = res.data?.answer || 'No answer received from backend';
//       setResponse(answer);
//       addLog(`Success – response received in ${responseTime}s`, 'success');
      
//       // Debug: Log the response to see the format
//       console.log('Response received:', answer);

//       // Parse migration statistics from the answer
//       const createdMatch = answer.match(/• Created: (\d+)/);
//       const existedMatch = answer.match(/• Already Exists: (\d+)/);
//       const failedMatch = answer.match(/• Failed: (\d+)/);
//       const skippedMatch = answer.match(/• Skipped: (\d+)/);
//       const progressMatch = answer.match(/Progress: \d+\.?\d*% \((\d+) \/ (\d+) secrets\)/);

//       // Parse audit log data
//       const auditLogSection = answer.match(/Audit Log Record \(DynamoDB Raw Columns\)[\s\S]*?(?=\n\n|\n$|$)/);
//       let auditData = null;
      
//       if (auditLogSection) {
//         const auditText = auditLogSection[0];
//         console.log('Audit log section found:', auditText);
        
//         // Try different patterns based on the actual format
//         const batchIdMatch = auditText.match(/batch_id\s*\t\s*([^\n]+)/) || auditText.match(/batch_id\s*\|\s*([^\n]+)/);
//         const sortKeyMatch = auditText.match(/sort_key\s*\t\s*([^\n]+)/) || auditText.match(/sort_key\s*\|\s*([^\n]+)/);
//         const statusMatch = auditText.match(/status\s*\t\s*([^\n]+)/) || auditText.match(/status\s*\|\s*([^\n]+)/);
//         const startTimeMatch = auditText.match(/start_time\s*\t\s*([^\n]+)/) || auditText.match(/start_time\s*\|\s*([^\n]+)/);
//         const endTimeMatch = auditText.match(/end_time\s*\t\s*([^\n]+)/) || auditText.match(/end_time\s*\|\s*([^\n]+)/);
//         const updatedAtMatch = auditText.match(/updated_at\s*\t\s*([^\n]+)/) || auditText.match(/updated_at\s*\|\s*([^\n]+)/);
//         const totalAttemptedMatch = auditText.match(/total_attempted\s*\t\s*([^\n]+)/) || auditText.match(/total_attempted\s*\|\s*([^\n]+)/);
//         const processedCountMatch = auditText.match(/processed_count\s*\t\s*([^\n]+)/) || auditText.match(/processed_count\s*\|\s*([^\n]+)/);
//         const createdCountMatch = auditText.match(/created_count\s*\t\s*([^\n]+)/) || auditText.match(/created_count\s*\|\s*([^\n]+)/);
//         const alreadyExistsCountMatch = auditText.match(/already_exists_count\s*\t\s*([^\n]+)/) || auditText.match(/already_exists_count\s*\|\s*([^\n]+)/);
//         const failedCountMatch = auditText.match(/failed_count\s*\t\s*([^\n]+)/) || auditText.match(/failed_count\s*\|\s*([^\n]+)/);
//         const ttlMatch = auditText.match(/ttl\s*\t\s*([^\n]+)/) || auditText.match(/ttl\s*\|\s*([^\n]+)/);

//         console.log('Matches found:', {
//           batchId: !!batchIdMatch,
//           status: !!statusMatch,
//           startTime: !!startTimeMatch,
//           endTime: !!endTimeMatch
//         });

//         if (batchIdMatch && statusMatch && startTimeMatch && endTimeMatch) {
//           auditData = {
//             batch_id: batchIdMatch[1].trim(),
//             sort_key: sortKeyMatch ? sortKeyMatch[1].trim() : '',
//             status: statusMatch[1].trim(),
//             start_time: startTimeMatch[1].trim(),
//             end_time: endTimeMatch[1].trim(),
//             updated_at: updatedAtMatch ? updatedAtMatch[1].trim() : '',
//             total_attempted: totalAttemptedMatch ? parseInt(totalAttemptedMatch[1].trim()) : 0,
//             processed_count: processedCountMatch ? parseInt(processedCountMatch[1].trim()) : 0,
//             created_count: createdCountMatch ? parseInt(createdCountMatch[1].trim()) : 0,
//             already_exists_count: alreadyExistsCountMatch ? parseInt(alreadyExistsCountMatch[1].trim()) : 0,
//             failed_count: failedCountMatch ? parseInt(failedCountMatch[1].trim()) : 0,
//             ttl: ttlMatch ? ttlMatch[1].trim() : ''
//           };
//         } else {
//           console.log('Required fields not found in audit log section');
//         }
//       } else {
//         console.log('Audit log section not found in response');
        
//         // Fallback: Try to find individual lines anywhere in the response
//         const batchIdMatch = answer.match(/batch_id\s*\t\s*([^\n]+)/) || answer.match(/batch_id\s*\|\s*([^\n]+)/);
//         const statusMatch = answer.match(/status\s*\t\s*([^\n]+)/) || answer.match(/status\s*\|\s*([^\n]+)/);
//         const startTimeMatch = answer.match(/start_time\s*\t\s*([^\n]+)/) || answer.match(/start_time\s*\|\s*([^\n]+)/);
//         const endTimeMatch = answer.match(/end_time\s*\t\s*([^\n]+)/) || answer.match(/end_time\s*\|\s*([^\n]+)/);
//         const totalAttemptedMatch = answer.match(/total_attempted\s*\t\s*([^\n]+)/) || answer.match(/total_attempted\s*\|\s*([^\n]+)/);
//         const processedCountMatch = answer.match(/processed_count\s*\t\s*([^\n]+)/) || answer.match(/processed_count\s*\|\s*([^\n]+)/);
//         const createdCountMatch = answer.match(/created_count\s*\t\s*([^\n]+)/) || answer.match(/created_count\s*\|\s*([^\n]+)/);
//         const alreadyExistsCountMatch = answer.match(/already_exists_count\s*\t\s*([^\n]+)/) || answer.match(/already_exists_count\s*\|\s*([^\n]+)/);
//         const failedCountMatch = answer.match(/failed_count\s*\t\s*([^\n]+)/) || answer.match(/failed_count\s*\|\s*([^\n]+)/);
//         const ttlMatch = answer.match(/ttl\s*\t\s*([^\n]+)/) || answer.match(/ttl\s*\|\s*([^\n]+)/);
        
//         console.log('Fallback matches found:', {
//           batchId: !!batchIdMatch,
//           status: !!statusMatch,
//           startTime: !!startTimeMatch,
//           endTime: !!endTimeMatch
//         });
        
//         if (batchIdMatch && statusMatch && startTimeMatch && endTimeMatch) {
//           auditData = {
//             batch_id: batchIdMatch[1].trim(),
//             sort_key: '',
//             status: statusMatch[1].trim(),
//             start_time: startTimeMatch[1].trim(),
//             end_time: endTimeMatch[1].trim(),
//             updated_at: '',
//             total_attempted: totalAttemptedMatch ? parseInt(totalAttemptedMatch[1].trim()) : 0,
//             processed_count: processedCountMatch ? parseInt(processedCountMatch[1].trim()) : 0,
//             created_count: createdCountMatch ? parseInt(createdCountMatch[1].trim()) : 0,
//             already_exists_count: alreadyExistsCountMatch ? parseInt(alreadyExistsCountMatch[1].trim()) : 0,
//             failed_count: failedCountMatch ? parseInt(failedCountMatch[1].trim()) : 0,
//             ttl: ttlMatch ? ttlMatch[1].trim() : ''
//           };
//           console.log('Audit data parsed using fallback method');
//         }
//       }

//       if (createdMatch && existedMatch && failedMatch && skippedMatch && progressMatch) {
//         setMigrationStats({
//           total: parseInt(progressMatch[2]), // Total from progress line
//           created: parseInt(createdMatch[1]),
//           existed: parseInt(existedMatch[1]),
//           failed: parseInt(failedMatch[1]),
//           skipped: parseInt(skippedMatch[1]),
//         });
//         addLog(`Migration stats parsed: Created=${createdMatch[1]}, Exists=${existedMatch[1]}, Failed=${failedMatch[1]}, Skipped=${skippedMatch[1]}`, 'success');
//       } else {
//         setMigrationStats(null); // Reset if no stats found
//         addLog('Failed to parse migration stats from response', 'error');
//       }

//       if (auditData) {
//         setAuditLogData(auditData);
//         addLog(`Audit log data parsed: Batch ID=${auditData.batch_id}, Status=${auditData.status}`, 'success');
//       } else {
//         setAuditLogData(null);
//         addLog('Failed to parse audit log data from response', 'error');
//       }

//       // --- NEW: FETCH THE LOG LINK ONCE ---
//       try {
//         const linkRes = await axios.get(LOG_FETCH_URL);
//         if (linkRes.data?.logLink) {
//           setLogLink(linkRes.data.logLink);
//         }
//       } catch (linkErr) {
//         console.error("Failed to fetch log link", linkErr);
//       }
//       // ------------------------------------

//     } catch (err) {
//       const endTime = Date.now();
//       const responseTime = ((endTime - startTime) / 1000).toFixed(2);
      
//       let msg = 'Request failed';
//       if (err.response) {
//         msg = err.response.data?.message || `Status ${err.response.status}`;
//       } else if (err.request) {
//         msg = 'No response from server (timeout / network / CORS?)';
//       } else {
//         msg = err.message;
//       }

//       console.error('API Error:', err);
//       setError(msg);
//       addLog(`Error: ${msg} (${responseTime}s)`, 'error');
//       setResponse('Failed to get response. Check console logs below.');
//       setMigrationStats(null); // Reset stats on error
//       setAuditLogData(null); // Reset audit data on error
//     } finally {
//       setLoading(false);
//       addLog('Request finished');
//     }
//   };

//   return (
//     <div className="app-container">
//       <header className="header">
//         <div className="batch-info">
//           <span className="batch-size-text">MAXIMUM BATCH SECRETS = 500</span>
//         </div>
//         <h1>Bedrock AI Agent – Beta Dashboard</h1>
//         {logLink && (
//           <div className="floating-log-button">
//             <a 
//               href={logLink} 
//               target="_blank" 
//               rel="noopener noreferrer" 
//               className="log-button"
//             >
//               View AWS CloudWatch Logs ↗
//             </a>
//           </div>
//         )}
//       </header>

//       <main className="dashboard">
//         {/* Input */}
//         <section className="card input-card">
//           <h2>Ask your agent</h2>
//           <textarea
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//             placeholder="Type your question here..."
//             rows={5}
//             disabled={loading}
//           />
//           <button
//             onClick={handleAsk}
//             disabled={loading || prompt.trim() === ''}
//             className={loading ? 'loading' : ''}
//           >
//             {loading ? 'Thinking...' : 'Send Prompt'}
//           </button>

//           {error && <div className="error-box">{error}</div>}
//         </section>

//         {/* Console / Activity Log */}
//         <section className="card console-card">
//           <h2>Console / Activity Log</h2>
//           <div className="logs-container">
//             {logs.length === 0 ? (
//               <div className="logs-empty">No activity yet...</div>
//             ) : (
//               logs.map((log, idx) => (
//                 <div key={idx} className={`log-item ${log.type}`}>
//                   <span className="log-time">[{log.time}]</span> {log.message}
//                 </div>
//               ))
//             )}
//           </div>
//         </section>

//         {/* Audit Log Dashboard */}
//         {auditLogData && (
//           <section className="card audit-log-card">
//             <h2>Audit Log Record</h2>
//             <AuditLogDashboard auditData={auditLogData} />
//           </section>
//         )}

//         {/* Migration Progress Bars */}
//         {migrationStats && (
//           <section className="card progress-card">
//             <h2>Migration Progress</h2>
//             <div className="progress-container">
//               <div className="progress-item">
//                 <div className="progress-label">
//                   <span>Created</span>
//                   <span className="progress-count">{migrationStats.created}/{migrationStats.total}</span>
//                 </div>
//                 <div className="progress-bar">
//                   <div 
//                     className="progress-fill created"
//                     style={{ width: `${(migrationStats.created / migrationStats.total) * 100}%` }}
//                   />
//                 </div>
//               </div>

//               <div className="progress-item">
//                 <div className="progress-label">
//                   <span>Already Existed</span>
//                   <span className="progress-count">{migrationStats.existed}/{migrationStats.total}</span>
//                 </div>
//                 <div className="progress-bar">
//                   <div 
//                     className="progress-fill existed"
//                     style={{ width: `${(migrationStats.existed / migrationStats.total) * 100}%` }}
//                   />
//                 </div>
//               </div>

//               <div className="progress-item">
//                 <div className="progress-label">
//                   <span>Failed</span>
//                   <span className="progress-count">{migrationStats.failed}/{migrationStats.total}</span>
//                 </div>
//                 <div className="progress-bar">
//                   <div 
//                     className="progress-fill failed"
//                     style={{ width: `${(migrationStats.failed / migrationStats.total) * 100}%` }}
//                   />
//                 </div>
//               </div>

//               {migrationStats.skipped > 0 && (
//                 <div className="progress-item">
//                   <div className="progress-label">
//                     <span>Skipped</span>
//                     <span className="progress-count">{migrationStats.skipped}/{migrationStats.total}</span>
//                   </div>
//                   <div className="progress-bar">
//                     <div 
//                       className="progress-fill skipped"
//                       style={{ width: `${(migrationStats.skipped / migrationStats.total) * 100}%` }}
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {/* Response and Pie Chart Container */}
//         {migrationStats ? (
//           <div className="response-chart-container">
//             {/* Response */}
//             <section className="card response-card">
//               <h2>Response</h2>
//               <div className="response-content">
//                 {response || (loading ? 'Waiting for Bedrock...' : 'Answer will appear here')}
//               </div>
//             </section>

//             {/* Pie Chart */}
//             <section className="card pie-chart-card">
//               <h2>Migration Breakdown</h2>
//               <div className="pie-chart-container">
//                 <MigrationDashboard migrationStats={migrationStats} />
//               </div>
//             </section>

//             {/* Migration Statistics */}
//             <section className="card migration-stats-card">
//               <h2>Migration Statistics</h2>
//               <div className="migration-stats-content">
//                 <div className="stats-grid">
//                   <div className="stat-item">
//                     <span className="stat-label">Total Processed</span>
//                     <span className="stat-value">{migrationStats.total}</span>
//                   </div>
//                   <div className="stat-item">
//                     <span className="stat-label">Created</span>
//                     <span className="stat-value created">{migrationStats.created}</span>
//                   </div>
//                   <div className="stat-item">
//                     <span className="stat-label">Already Exists</span>
//                     <span className="stat-value existed">{migrationStats.existed}</span>
//                   </div>
//                   <div className="stat-item">
//                     <span className="stat-label">Failed</span>
//                     <span className="stat-value failed">{migrationStats.failed}</span>
//                   </div>
//                   {migrationStats.skipped > 0 && (
//                     <div className="stat-item">
//                       <span className="stat-label">Skipped</span>
//                       <span className="stat-value skipped">{migrationStats.skipped}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </section>

//             {/* Response Times */}
//             {responseTimes.length > 0 && (
//               <section className="card response-time-card">
//                 <h2>Response Times</h2>
//                 <div className="response-time-chart">
//                   <Line
//                     data={{
//                       labels: responseTimes.map((_, index) => `Call ${index + 1}`),
//                       datasets: [
//                         {
//                           label: 'Response Time (seconds)',
//                           data: responseTimes,
//                           borderColor: '#3b82f6',
//                           backgroundColor: 'rgba(59, 130, 246, 0.15)',
//                           tension: 0.3,
//                         },
//                       ],
//                     }}
//                     options={{
//                       responsive: true,
//                       maintainAspectRatio: false,
//                       plugins: { 
//                         legend: { display: false },
//                         tooltip: {
//                           callbacks: {
//                             label: function(context) {
//                               return `${context.parsed.y}s`;
//                             }
//                           }
//                         }
//                       },
//                       scales: {
//                         y: {
//                           beginAtZero: true,
//                           grid: { display: false }
//                         },
//                         x: {
//                           grid: { display: false }
//                         }
//                       }
//                     }}
//                   />
//                 </div>
//               </section>
//             )}
//           </div>
//         ) : (
//           /* Response - standalone when no migration stats */
//           <section className="card response-card">
//             <h2>Response</h2>
//             <div className="response-content">
//               {response || (loading ? 'Waiting for Bedrock...' : 'Answer will appear here')}
//             </div>
//           </section>
//         )}

//         </main>

//       <footer className="footer">
//         Migration to AWS Secrets Manager
//       </footer>
//     </div>
//   );
// }

// export default App;