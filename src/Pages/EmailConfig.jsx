import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { emailConfigAPI } from "../utils/Api";

const EmailConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    provider: "",
    smtp_host: "",
    smtp_port: "",
    smtp_secure: false,
    smtp_user: "",
    smtp_password: "",
    from_email: "",
    from_name: "",
    reply_to: "",
  });
  const [hasPassword, setHasPassword] = useState(false);
  const [testTo, setTestTo] = useState("");

  const loadActive = async () => {
    setLoading(true);
    try {
      const res = await emailConfigAPI.getActive();
      const data = res?.data || null;
      if (data) {
        setConfig((prev) => ({
          ...prev,
          provider: data.provider || "",
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port ?? "",
          smtp_secure: !!data.smtp_secure,
          smtp_user: data.smtp_user || "",
          smtp_password: "",
          from_email: data.from_email || "",
          from_name: data.from_name || "",
          reply_to: data.reply_to || "",
        }));
        setHasPassword(!!data.has_password);
      } else {
        setHasPassword(false);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to load email config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActive();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await emailConfigAPI.upsertActive({
        ...config,
        smtp_port: config.smtp_port ? Number(config.smtp_port) : null,
      });
      toast.success("Email config saved");
      await loadActive();
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.message || "Failed to save email config");
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    if (!testTo) {
      toast.error("Enter a test receiver email");
      return;
    }
    setTesting(true);
    try {
      await emailConfigAPI.test({ to: testTo });
      toast.success("Test email sent");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 font-inter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Email Gateway</h1>
          <p className="text-sm text-slate-500 font-medium">Configure SMTP parameters for system notifications and security OTPs.</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">System Config</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initialising Settings...</p>
        </div>
      ) : (
        <form onSubmit={onSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Server Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                     <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">SMTP Server Settings</h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Physical provider parameters</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Provider Service</label>
                    <input
                      name="provider"
                      value={config.provider}
                      onChange={onChange}
                      placeholder="Gmail / Zoho / Outlook"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all group">
                      <input
                        type="checkbox"
                        name="smtp_secure"
                        checked={config.smtp_secure}
                        onChange={onChange}
                        className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20"
                      />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900">SMTP Secure (SSL/TLS)</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SMTP Hostname</label>
                    <input
                      name="smtp_host"
                      value={config.smtp_host}
                      onChange={onChange}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SMTP Port</label>
                    <input
                      name="smtp_port"
                      value={config.smtp_port}
                      onChange={onChange}
                      placeholder="587"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* sender Identity */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                     <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Sender Identity</h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Public facing email details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From Email Address</label>
                    <input
                      name="from_email"
                      value={config.from_email}
                      onChange={onChange}
                      placeholder="noreply@domain.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                    <input
                      name="from_name"
                      value={config.from_name}
                      onChange={onChange}
                      placeholder="Fleet App"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reply-To Address</label>
                    <input
                      name="reply_to"
                      value={config.reply_to}
                      onChange={onChange}
                      placeholder="support@domain.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Credentials Card */}
              <div className="bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center">
                       <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-tight">Access Control</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SMTP Username</label>
                      <input
                        name="smtp_user"
                        value={config.smtp_user}
                        onChange={onChange}
                        placeholder="user@domain.com"
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500/50 transition-all outline-none font-mono placeholder-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                         SMTP Password
                         <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${hasPassword ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                           {hasPassword ? "SECURE" : "MISSING"}
                         </span>
                      </label>
                      <input
                        name="smtp_password"
                        value={config.smtp_password}
                        onChange={onChange}
                        placeholder={hasPassword ? "Leave blank to keep existing" : "App password"}
                        type="password"
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500/50 transition-all outline-none font-mono placeholder-slate-500"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                      {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                      {saving ? "Deploying..." : "Update Configuration"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Card */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    Connectivity Diagnostics
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        value={testTo}
                        onChange={(e) => setTestTo(e.target.value)}
                        placeholder="test@domain.com"
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-mono"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                         <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onTest}
                      disabled={testing}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      {testing ? <div className="animate-spin rounded-full h-3 h-3 border-b-2 border-slate-600"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      Run SMTP Test
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium text-center italic">Send a test payload to verify handshake.</p>
                  </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default EmailConfig;

