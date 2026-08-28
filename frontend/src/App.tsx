import React, { useState, useEffect } from 'react';
import { Send, Clock, PlusCircle, Search, RefreshCw, LogOut, Upload, Paperclip, Bold, Italic, List, AlignLeft, ArrowLeft } from 'lucide-react';

interface User {
  email: string;
  name: string;
  avatar: string;
}

interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  status: string;
  scheduledFor?: string;
  sentAt?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('reachinbox_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [currentView, setCurrentView] = useState<'dashboard' | 'compose'>('dashboard');
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');

  const [recipientInput, setRecipientInput] = useState('');
  const [leads, setLeads] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayBetween, setDelayBetween] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(50);
  const [startTime, setStartTime] = useState('');
  const [showSendLater, setShowSendLater] = useState(false);

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
    if (user) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 4000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleGoogleLogin = () => {
    const loggedUser = {
      name: 'Oliver Brown',
      email: 'oliver.brown@domain.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    };
    setUser(loggedUser);
    localStorage.setItem('reachinbox_user', JSON.stringify(loggedUser));
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const loggedUser = {
      name: emailInput.split('@')[0],
      email: emailInput,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    };
    setUser(loggedUser);
    localStorage.setItem('reachinbox_user', JSON.stringify(loggedUser));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = text.split(/[\r\n,]+/).map(e => e.trim()).filter(e => e.includes('@'));
      setLeads(prev => [...prev, ...parsed]);
    };
    reader.readAsText(file);
  };

  const addRecipientTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && recipientInput.trim()) {
      e.preventDefault();
      if (recipientInput.includes('@')) {
        setLeads(prev => [...prev, recipientInput.trim()]);
        setRecipientInput('');
      }
    }
  };

  const handleSendCampaign = async () => {
    const finalLeads = recipientInput.includes('@') ? [...leads, recipientInput.trim()] : leads;
    if (finalLeads.length === 0) {
      setMessage('Please enter or upload at least one valid recipient lead.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/emails/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: user?.email,
          leads: finalLeads,
          subject: subject || 'No Subject',
          body: body || '<p>Hello</p>',
          startTime: startTime ? new Date(startTime).getTime() : undefined,
          delayBetweenSeconds: delayBetween,
          hourlyLimit
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully scheduled ${finalLeads.length} emails!`);
        setCurrentView('dashboard');
        setLeads([]);
        setRecipientInput('');
        setSubject('');
        setBody('');
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

  // Login Screen matching Figma layout
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <span className="font-semibold text-sm">Outbox Labs Assignment</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h1 className="text-3xl font-bold text-center text-gray-900">Login</h1>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium py-3 px-4 rounded-xl hover:bg-emerald-100 transition shadow-xs text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Login with Google
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs">or sign up through email</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <input 
                  type="email" 
                  value={emailInput} 
                  onChange={e => setEmailInput(e.target.value)} 
                  placeholder="Email ID" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <div>
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  placeholder="Password" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition shadow-sm text-sm"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard & Compose Views matching Figma layout
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <header className="border-b border-gray-200 px-6 py-3 flex justify-between items-center bg-white">
        <div className="flex items-center gap-8">
          <span className="font-black tracking-widest text-xl">ONB</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="http://localhost:5000/admin/queues" target="_blank" rel="noreferrer" className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200">
            Queue Admin 📊
          </a>
          <button onClick={() => { setUser(null); localStorage.removeItem('reachinbox_user'); }} className="text-gray-400 hover:text-red-600">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 border-r border-gray-200 p-4 flex flex-col gap-6 bg-white">
          <div className="flex items-center justify-between border border-gray-200 p-2 rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('compose')}
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-xs"
          >
            <PlusCircle size={16} /> Compose
          </button>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Core</p>
            <button 
              onClick={() => { setActiveTab('scheduled'); setCurrentView('dashboard'); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${activeTab === 'scheduled' && currentView === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="flex items-center gap-2"><Clock size={14} /> Scheduled</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{scheduledJobs.length}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('sent'); setCurrentView('dashboard'); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${activeTab === 'sent' && currentView === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="flex items-center gap-2"><Send size={14} /> Sent</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{sentJobs.length}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-white p-6 overflow-y-auto">
          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
              {message}
            </div>
          )}

          {currentView === 'dashboard' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3 w-full max-w-md bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                  <Search size={16} className="text-gray-400" />
                  <input type="text" placeholder="Search" className="bg-transparent text-xs w-full focus:outline-none" />
                </div>
                <button onClick={fetchJobs} className="text-gray-400 hover:text-gray-600">
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {activeTab === 'scheduled' ? (
                  scheduledJobs.length === 0 ? (
                    <p className="text-xs text-gray-400 py-8 text-center">No scheduled items found.</p>
                  ) : (
                    scheduledJobs.map(job => (
                      <div key={job.id} className="py-3 flex items-center justify-between hover:bg-gray-50 px-3 rounded-xl transition text-xs">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-gray-900 w-36 truncate">{job.recipientEmail}</span>
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 text-[10px]">{job.status}</span>
                          <span className="text-gray-600">{job.subject}</span>
                        </div>
                        <span className="text-gray-400 font-mono text-[11px]">{job.scheduledFor ? new Date(job.scheduledFor).toLocaleTimeString() : '-'}</span>
                      </div>
                    ))
                  )
                ) : (
                  sentJobs.length === 0 ? (
                    <p className="text-xs text-gray-400 py-8 text-center">No sent history records found.</p>
                  ) : (
                    sentJobs.map(job => (
                      <div key={job.id} className="py-3 flex items-center justify-between hover:bg-gray-50 px-3 rounded-xl transition text-xs">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-gray-900 w-36 truncate">{job.recipientEmail}</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] ${job.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{job.status}</span>
                          <span className="text-gray-600">{job.subject}</span>
                        </div>
                        <span className="text-gray-400 font-mono text-[11px]">{job.sentAt ? new Date(job.sentAt).toLocaleTimeString() : '-'}</span>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900">
                  <ArrowLeft size={16} /> Compose New Email
                </button>
                <div className="flex items-center gap-3 relative">
                  <label className="cursor-pointer text-gray-500 hover:text-gray-700">
                    <Paperclip size={18} />
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button onClick={() => setShowSendLater(!showSendLater)} className="text-gray-500 hover:text-gray-700">
                    <Clock size={18} />
                  </button>
                  <button 
                    onClick={handleSendCampaign}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>

                  {showSendLater && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72 z-20 space-y-3">
                      <p className="text-xs font-bold text-gray-700">Send Later</p>
                      <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-xs" />
                      <button onClick={() => setShowSendLater(false)} className="w-full bg-emerald-600 text-white rounded-lg py-1.5 text-xs font-semibold">Done</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <span className="w-24 text-gray-400 font-medium">From</span>
                  <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-700">
                    <option>{user.email}</option>
                  </select>
                </div>

                <div className="flex items-start border-b border-gray-100 pb-2">
                  <span className="w-24 text-gray-400 font-medium pt-1">To</span>
                  <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                    {leads.map((l, idx) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                        {l} <button onClick={() => setLeads(leads.filter((_, i) => i !== idx))} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                    <input 
                      type="email" 
                      value={recipientInput} 
                      onChange={e => setRecipientInput(e.target.value)} 
                      onKeyDown={addRecipientTag}
                      placeholder="recipient@example.com (Press Enter)" 
                      className="flex-1 bg-transparent focus:outline-none py-1"
                    />
                    <label className="text-emerald-600 font-semibold cursor-pointer flex items-center gap-1 hover:underline">
                      <Upload size={12} /> Upload List
                      <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex items-center border-b border-gray-100 pb-2">
                  <span className="w-24 text-gray-400 font-medium">Subject</span>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="flex-1 bg-transparent focus:outline-none" />
                </div>

                <div className="flex items-center gap-6 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium">Delay between 2 emails</span>
                    <input type="number" value={delayBetween} onChange={e => setDelayBetween(Number(e.target.value))} min={1} className="w-16 border border-gray-200 rounded px-2 py-1 text-center" />
                    <span className="text-gray-400">sec</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium">Hourly limit</span>
                    <input type="number" value={hourlyLimit} onChange={e => setHourlyLimit(Number(e.target.value))} min={1} className="w-16 border border-gray-200 rounded px-2 py-1 text-center" />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-3 text-gray-500">
                    <button><Bold size={14} /></button>
                    <button><Italic size={14} /></button>
                    <button><List size={14} /></button>
                    <button><AlignLeft size={14} /></button>
                  </div>
                  <textarea 
                    rows={8} 
                    value={body} 
                    onChange={e => setBody(e.target.value)} 
                    placeholder="Type Your Reply..." 
                    className="w-full p-4 focus:outline-none text-xs font-sans text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}