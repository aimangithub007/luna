import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Play, Pause, Trash2, Plus, Search as SearchIcon } from "lucide-react";
import { fuzzySearch } from "../lib/utils";

export function CronPage() {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ prompt: '', schedule: '0 9 * * *', name: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const load = () => api.getCronJobs().then(setJobs).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleAction = async (aj, id) => {
    if(aj === 'pause') await api.pauseCronJob(id);
    if(aj === 'resume') await api.resumeCronJob(id);
    if(aj === 'trigger') await api.triggerCronJob(id);
    if(aj === 'delete') {
      if (!confirm('Are you sure?')) return;
      await api.deleteCronJob(id);
    }
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createCronJob(form);
    setShowModal(false);
    load();
  };

  const filteredJobs = fuzzySearch(searchQuery, jobs, ['name', 'prompt']);

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: 20, color: 'var(--t1)', fontWeight: 600}}>Scheduled Jobs (Cron)</div>
        <div style={{display: 'flex', gap: 10}}>
          <div style={{position: 'relative'}}>
            <SearchIcon size={14} style={{position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)'}}/>
            <input 
              placeholder="Fuzzy search tasks..." 
              value={searchQuery} 
              onChange={e=>setSearchQuery(e.target.value)}
              style={{paddingLeft: 30, width: 200, fontSize: 12}}
            />
          </div>
          <button className="btn btp" onClick={()=>setShowModal(!showModal)}><Plus size={14}/> New Job</button>
        </div>
      </div>
      
      {showModal && (
        <form className="card" onSubmit={handleCreate} style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--s2)'}}>
          <input placeholder="Job Name (e.g. Morning Summary)" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} style={{padding: 10}}/>
          <input placeholder="Prompt (What should the agent do?)" value={form.prompt} onChange={e=>setForm({...form, prompt: e.target.value})} required style={{padding: 10}}/>
          <input placeholder="Schedule Config (e.g. 0 9 * * *)" value={form.schedule} onChange={e=>setForm({...form, schedule: e.target.value})} required style={{padding: 10}}/>
          <button className="btn btp" type="submit" style={{alignSelf: 'flex-start', padding: "8px 16px"}}>Save Job</button>
        </form>
      )}

      <div className="card" style={{display: 'flex', flexDirection: 'column'}}>
        {filteredJobs.length === 0 && <div style={{padding: 20, color: 'var(--t3)'}}>{searchQuery ? 'No matching jobs found.' : 'No cron jobs found. You can create one above.'}</div>}
        {filteredJobs.map(j => (
          <div key={j.id} style={{padding: '14px 18px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                 <div style={{fontSize: 15, color: j.enabled ? 'var(--ac)' : 'var(--t3)', fontWeight: 600}}>{j.name || 'Unnamed Job'}</div>
                 <div className={`badge ${j.enabled ? 'bg' : 'bn'}`} style={{fontSize: 9}}>{j.enabled ? 'ACTIVE' : 'PAUSED'}</div>
              </div>
              <div style={{fontSize: 13, color: 'var(--t1)', marginTop: 6}}>{j.prompt}</div>
              <div className="mono" style={{fontSize: 11, color: 'var(--t3)', marginTop: 8}}>Expr: {j.schedule?.display || j.schedule?.expr}</div>
            </div>
            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              {j.enabled ? (
                 <button className="btn btg" onClick={()=>handleAction('pause', j.id)}><Pause size={14}/> Pause</button>
              ) : (
                 <button className="btn btp" onClick={()=>handleAction('resume', j.id)}><Play size={14}/> Resume</button>
              )}
              <button className="btn btg" onClick={()=>handleAction('trigger', j.id)}>Run Now</button>
              <button className="btn" style={{background: 'var(--red)', color: 'var(--re)'}} onClick={()=>handleAction('delete', j.id)}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
