import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, PlusCircle, RefreshCw } from 'lucide-react';

interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  status: string;
  scheduledFor: string;
  sentAt?: string;
  errorMessage?: string;
}

export default function App() {
  const [senderEmail, setSenderEmail] = useState('john@reachinbox.ai');
  const [leadsInput, setLeadsInput] = useState('');
  const [subject, setSubject] = useState('Quick question regarding your workflow');
  const [body] = useState('<p>Hi,</p><p>I noticed your recent work and wanted to connect about scaling your infrastructure.</p>');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(50);
  
  const [scheduledJobs, setScheduledJobs] = useState<EmailJob[]>([]);
  const [sentJobs, setSentJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchJobs = async () => {
    try {
      const resSched = await fetch('http://localhost:5000/api/emails/scheduled');
      const dataSched = await resSched.json();
      setScheduledJobs(dataSched);

      const resSent = await fetch('http://localhost:5000/api/emails/sent');
      const dataSent = await resSent.json();
      setSentJobs(dataSent);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 4000); // Poll every 4 seconds for live updates
    return () => clearInterval(interval);
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const leads = leadsInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (leads.length === 0) {
      setMessage('Please enter at least one recipient email.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/emails/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail,
          leads,
          subject,
          body,
          delayBetweenSeconds: delaySeconds,
          hourlyLimit
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! ${data.message}`);
        setLeadsInput('');
        fetchJobs();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="text-indigo-500" /> ReachInbox Smart Scheduler
          </h1>
          <p className="text-sm text-slate-400">Manage drip campaigns with automated Redis rate-limiting & zero cron jobs.</p>
        </div>
        <a 
          href="http://localhost:5000/admin/queues" 
          target="_blank" 
          rel="noreferrer"
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Open Bull-Board Queue 📊
        </a>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Form */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl lg:col-span-1 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusCircle className="text-indigo-400" /> New Campaign Batch
          </h2>
          
          {message && (
            <div className="mb-4 p-3 bg-slate-800 border border-slate-700 text-sm rounded-lg text-indigo-300">
              {message}
            </div>
          )}

          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sender Email</label>
              <input 
                type="email" 
                value={senderEmail} 
                onChange={e => setSenderEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Recipient Leads (One per line)</label>
              <textarea 
                rows={4}
                value={leadsInput}
                onChange={e => setLeadsInput(e.target.value)}
                placeholder="lead1@gmail.com&#10;lead2@yahoo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email Subject</label>
              <input 
                type="text" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Delay (Seconds)</label>
                <input 
                  type="number" 
                  value={delaySeconds} 
                  onChange={e => setDelaySeconds(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Hourly Limit</label>
                <input 
                  type="number" 
                  value={hourlyLimit} 
                  onChange={e => setHourlyLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  min={1}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-2 rounded-lg transition disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Scheduling...' : 'Schedule & Send Batch'}
            </button>
          </form>
        </section>

        {/* Live Queues & Logs */}
        <section className="lg:col-span-2 space-y-6">
          {/* Pending Queue */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="text-amber-400" /> Active & Scheduled Queue ({scheduledJobs.length})
              </h2>
              <button onClick={fetchJobs} className="text-slate-400 hover:text-white transition">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 uppercase text-xs text-slate-500">
                  <tr>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Scheduled For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {scheduledJobs.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-500">No active queue items</td></tr>
                  ) : (
                    scheduledJobs.map(job => (
                      <tr key={job.id}>
                        <td className="p-3">{job.recipientEmail}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-amber-950/50 text-amber-400 border border-amber-800/50">
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{new Date(job.scheduledFor).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Completed / Sent Log */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" /> Delivery History ({sentJobs.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 uppercase text-xs text-slate-500">
                  <tr>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {sentJobs.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-500">No sent emails yet</td></tr>
                  ) : (
                    sentJobs.map(job => (
                      <tr key={job.id}>
                        <td className="p-3">{job.recipientEmail}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded ${job.status === 'SENT' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/50 text-rose-400 border border-rose-800/50'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{job.sentAt ? new Date(job.sentAt).toLocaleTimeString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}