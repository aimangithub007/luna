import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function AnalyticsPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    api.getAnalytics(30).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="pg" style={{padding: 20}}>Loading Analytics...</div>;

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div>
        <div style={{fontSize: 20, color: 'var(--t1)', fontWeight: 600}}>Analytics (Last 30 Days)</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
        <div className="card" style={{padding: 15}}>
          <div style={{fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 5}}>Input Tokens</div>
          <div style={{fontSize: 24, fontWeight: 600, color: 'var(--bl)'}}>{data.totals?.total_input?.toLocaleString()}</div>
        </div>
        <div className="card" style={{padding: 15}}>
          <div style={{fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 5}}>Output Tokens</div>
          <div style={{fontSize: 24, fontWeight: 600, color: 'var(--ac)'}}>{data.totals?.total_output?.toLocaleString()}</div>
        </div>
        <div className="card" style={{padding: 15}}>
          <div style={{fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 5}}>Total Cost</div>
          <div style={{fontSize: 24, fontWeight: 600, color: 'var(--gr)'}}>${data.totals?.total_estimated_cost?.toFixed(4)}</div>
        </div>
        <div className="card" style={{padding: 15}}>
          <div style={{fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 5}}>Total Sessions</div>
          <div style={{fontSize: 24, fontWeight: 600}}>{data.totals?.total_sessions}</div>
        </div>
      </div>
      <div className="card" style={{flex: 1, padding: 15, display: 'flex', flexDirection: 'column', overflowY: 'auto'}}>
        <div style={{fontSize: 12, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10}}>Daily Breakdown</div>
        <div style={{display: 'grid', gridTemplateColumns: '120px 100px 100px 100px 80px', borderBottom: '1px solid var(--bd)', paddingBottom: 5, marginBottom: 5, color: 'var(--t2)', fontSize: 11}}>
          <span>Date</span><span>Input Token</span><span>Output Token</span><span>Cost</span><span>Sessions</span>
        </div>
        {(data.daily || []).slice().reverse().map((d, i) => (
           <div key={i} style={{display: 'grid', gridTemplateColumns: '120px 100px 100px 100px 80px', padding: '6px 0', borderBottom: '1px solid var(--bd2)', fontSize: 13}}>
             <span className="mono" style={{color: 'var(--t1)'}}>{d.day}</span>
             <span className="mono" style={{color: 'var(--t3)'}}>{d.input_tokens}</span>
             <span className="mono" style={{color: 'var(--t3)'}}>{d.output_tokens}</span>
             <span className="mono" style={{color: 'var(--gr)'}}>${d.estimated_cost?.toFixed(4)}</span>
             <span>{d.sessions}</span>
           </div>
        ))}
      </div>
    </div>
  );
}
