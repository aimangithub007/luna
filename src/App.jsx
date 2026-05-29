import { useState, useEffect } from "react";
import {
  LayoutDashboard, Brain, CheckSquare, MessageSquare,
  Zap, Command, ChevronLeft, ChevronRight, Settings,
  RefreshCw, Search, AlertTriangle, CheckCircle,
  XCircle, Clock, Send, Archive, Play, Copy,
  Circle, ArrowRight, Server, Database, Bot, Activity, FileTerminal, Key, Users, Book, Terminal, Palette, Package
} from "lucide-react";

import { StatusPage } from "./pages/StatusPage";
import { LogsPage } from "./pages/LogsPage";
import { ConfigPage } from "./pages/ConfigPage";
import { KeysPage } from "./pages/KeysPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CronPage } from "./pages/CronPage";
import { SkillsPage } from "./pages/SkillsPage";
import { SessionsSearchPage } from "./pages/SessionsSearchPage";
import { CommandsPage } from "./pages/CommandsPage";
import { LoginPage } from "./pages/LoginPage";
import { ChatPage } from "./pages/ChatPage";
import ProfilesPage from "./pages/ProfilesPage";
import { DocsPage } from "./pages/DocsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UIPage } from "./pages/UIPage";
import { InstallationPage } from "./pages/InstallationPage";
import { InsightPage } from "./pages/InsightPage";
import { Router9UsagePage } from "./pages/Router9UsagePage";

import { api } from "./lib/api";
import { FloatingChatModal } from "./components/FloatingChatModal";
import { FloatingDocsModal } from "./components/FloatingDocsModal";
import { FloatingCommandModal } from "./components/FloatingCommandModal";
import { CommandPalette } from "./components/CommandPalette";


const G = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box}
  :root{
    --bg:#06080F;--s1:#0B0E1A;--s2:#101529;--s3:#171D37;
    --bd:rgba(255,255,255,0.055);--bd2:rgba(255,255,255,0.10);
    --ac:#5EEAD4;--acd:rgba(94,234,212,0.07);--acb:rgba(94,234,212,0.13);
    --t1:#F2F5FF;--t2:#B4C3E2;--t3:#6B7BA3;
    --gr:#4ADE80;--grd:rgba(74,222,128,0.1);
    --re:#F87171;--red:rgba(248,113,113,0.1);
    --ye:#FBBF24;--yed:rgba(251,191,36,0.1);
    --bl:#60A5FA;--bld:rgba(96,165,250,0.1);
    --pu:#A78BFA;--pud:rgba(167,139,250,0.1);
    --sw:228px;--sc:58px;--hh:52px;
  }
  body{font-family:'Outfit',-apple-system,sans-serif;background:var(--bg);color:var(--t1);margin:0}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:2px}
  ::-webkit-scrollbar-track{background:transparent}
  .sb{width:var(--sw);min-width:var(--sw);transition:width 220ms cubic-bezier(.4,0,.2,1),min-width 220ms cubic-bezier(.4,0,.2,1);background:var(--s1);border-right:1px solid var(--bd);display:flex;flex-direction:column;height:100vh;overflow:hidden;position:sticky;top:0;flex-shrink:0}
  .sb.cl{width:var(--sc);min-width:var(--sc)}
  .ni{display:flex;align-items:center;gap:10px;padding:8px 12px;margin:1px 7px;border-radius:8px;cursor:pointer;color:var(--t2);font-size:13.5px;transition:background 130ms,color 130ms;white-space:nowrap;overflow:hidden}
  .ni:hover{background:rgba(255,255,255,0.04);color:var(--t1)}
  .ni.act{background:var(--acd);color:var(--ac)}
  .ni .lbl{opacity:1;transition:opacity 160ms;flex:1}
  .sb.cl .lbl{opacity:0;pointer-events:none}
  .badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;font-size:11px;font-weight:500}
  .bg{background:var(--grd);color:var(--gr)}
  .br{background:var(--red);color:var(--re)}
  .by{background:var(--yed);color:var(--ye)}
  .bb{background:var(--bld);color:var(--bl)}
  .bp{background:var(--pud);color:var(--pu)}
  .bn{background:rgba(255,255,255,0.05);color:var(--t2)}
  .ba{background:var(--acd);color:var(--ac)}
  .card{background:var(--s1);border:1px solid var(--bd);border-radius:12px}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:500;cursor:pointer;border:none;outline:none;font-family:inherit;transition:opacity 130ms,transform 80ms}
  .btn:active{transform:scale(0.97)}
  .btp{background:var(--ac);color:#06080F}
  .btp:hover{opacity:0.88}
  .btg{background:rgba(255,255,255,0.05);color:var(--t2);border:1px solid var(--bd)}
  .btg:hover{background:rgba(255,255,255,0.08);color:var(--t1)}
  input,textarea,select{background:var(--s2);border:1px solid var(--bd);border-radius:8px;color:var(--t1);font-family:inherit;font-size:13px;padding:8px 12px;outline:none;transition:border-color 140ms;width:100%}
  select option{background:var(--s2);color:var(--t1)}
  input:focus,textarea:focus,select:focus{border-color:var(--ac)}

  input::placeholder,textarea::placeholder{color:var(--t3)}
  .mono{font-family:'JetBrains Mono',monospace}
  .dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0}
  .dg{background:var(--gr);box-shadow:0 0 5px rgba(74,222,128,0.5)}
  .dr{background:var(--re)}
  .dy{background:var(--ye);animation:blink 2s infinite}
  .dn{background:var(--t3)}
  .trow{display:grid;align-items:center;padding:11px 16px;border-bottom:1px solid var(--bd);font-size:13px;transition:background 120ms;cursor:pointer}
  .trow:hover{background:rgba(255,255,255,0.02)}
  .trow:last-child{border-bottom:none}
  .pg{animation:pgi 190ms ease}
  @keyframes pgi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  .bub-u{align-self:flex-end;background:var(--acd);border:1px solid var(--acb);border-radius:12px 12px 2px 12px;padding:10px 14px;max-width:70%;font-size:13.5px;line-height:1.55}
  .bub-a{align-self:flex-start;background:var(--s2);border:1px solid var(--bd);border-radius:12px 12px 12px 2px;padding:10px 14px;max-width:75%;font-size:13.5px;line-height:1.55}
  .rbar{height:3px;border-radius:2px;background:var(--bd);width:56px;overflow:hidden}
  .rbar-f{height:100%;border-radius:2px;background:var(--ac)}
  .tp{display:inline-flex;align-items:center;padding:2px 8px;background:rgba(255,255,255,0.05);border-radius:20px;font-size:11px;color:var(--t2)}
  .cb{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:500;background:rgba(255,255,255,0.05);border:1px solid var(--bd);color:var(--t2);cursor:pointer;transition:background 120ms}
  .cb:hover{background:rgba(255,255,255,0.08);color:var(--t1)}
  .nav-icon-btn{background:transparent;border:none;color:var(--t3);cursor:pointer;padding:4px;border-radius:6px;transition:all 0.2s}
  .nav-icon-btn:hover{color:var(--t1);background:rgba(255,255,255,0.05)}
  .nav-icon-btn.active{color:var(--ac);background:var(--acd)}
`;

// ── Mock Data ──────────────────────────────────────────────────────────────

const CONNS = [
  {id:'1',name:'Telegram Bot',type:'telegram',status:'connected',lat:42},
  {id:'2',name:'Claude Code',type:'claude_code',status:'connected',lat:11},
  {id:'3',name:'Ollama Local',type:'ollama',status:'connected',lat:7},
  {id:'4',name:'OpenAI GPT-4o',type:'openai',status:'disconnected',lat:null},
  {id:'5',name:'Anthropic API',type:'anthropic',status:'error',lat:null},
];

const HEALTH = [
  {name:'PostgreSQL',ok:true,ms:3},{name:'Redis',ok:true,ms:1},
  {name:'Agentic Core',ok:true,ms:15},{name:'Claude Code',ok:true,ms:11},
  {name:'Telegram',ok:true,ms:42},{name:'Ollama',ok:true,ms:7},
];

const MEM = [
  {id:'1',agent:'PaperNode',summary:'Keputusan arsitektur multi-agent untuk POS System dengan 7 tabel utama',type:'decision',tags:['architecture','pos','agent'],rel:0.95,acc:'2 jam lalu'},
  {id:'2',agent:'ContentSpecialist',summary:'Template konten Instagram untuk gamis collection spring — tone casual',type:'skill',tags:['content','instagram','gamis'],rel:0.87,acc:'5 jam lalu'},
  {id:'3',agent:'KnowledgeBase',summary:'Panduan deployment Docker multi-container untuk Agentic platform',type:'fact',tags:['docker','deployment'],rel:0.79,acc:'1 hari lalu'},
  {id:'4',agent:'VPSManager',summary:'SSH key rotation procedure untuk production server Agentic',type:'skill',tags:['security','vps','ssh'],rel:0.72,acc:'2 hari lalu'},
  {id:'5',agent:'PaperNode',summary:'Hasil analisis struktur organisasi Q2 2025 — 12 divisi mapped',type:'result',tags:['analysis','org'],rel:0.68,acc:'3 hari lalu'},
  {id:'6',agent:'SEOAgent',summary:'Strategi backlink domain gamis.co.id vs kompetitor — DA 34',type:'context',tags:['seo','backlink'],rel:0.61,acc:'4 hari lalu'},
];

const TASKS = [
  {id:'1',title:'Generate konten Instagram 10 post koleksi baru',agent:'ContentSpecialist',type:'content_creation',status:'running',priority:'high',dur:'3m 21s',created:'14:12'},
  {id:'2',title:'Analisis backlink kompetitor gamis marketplace',agent:'SEOAgent',type:'research',status:'completed',priority:'normal',dur:'12m 4s',created:'13:45'},
  {id:'3',title:'Deploy update POS Tool Node ke production VPS',agent:'VPSManager',type:'deployment',status:'completed',priority:'high',dur:'1m 45s',created:'12:30'},
  {id:'4',title:'Review kode WorkflowLoader refactor PR#47',agent:'CodeReviewer',type:'code_review',status:'failed',priority:'normal',dur:'2m 30s',created:'11:00'},
  {id:'5',title:'Sync knowledge base dari Obsidian vault',agent:'KnowledgeBase',type:'research',status:'queued',priority:'low',dur:null,created:'10:55'},
  {id:'6',title:'Buat laporan performa agent bulan ini',agent:'PaperNode',type:'content_creation',status:'completed',priority:'normal',dur:'8m 12s',created:'09:20'},
];

const MSGS = [
  {id:'1',role:'user',content:'Buatkan 5 caption Instagram untuk koleksi gamis terbaru, tone casual dan engaging',t:'14:23'},
  {id:'2',role:'assistant',content:'Berikut 5 caption untuk koleksi terbaru:\n\n1. "Anggun di setiap langkah, modern di setiap detail 🌸 Koleksi kami hadir untuk wanita yang tahu caranya tampil memukau tanpa berlebihan."\n\n2. "Gamis nggak harus ribet, yang penting confidence-nya nyata ✨ New collection is here."',t:'14:24'},
  {id:'3',role:'user',content:'Bagus! Tambahkan hashtag yang relevan untuk reach maksimal',t:'14:25'},
  {id:'4',role:'assistant',content:'#GamisModern #OOTD #GamisElegan #FashionMuslim #GamisTerbaru #ModernHijab #StyleMuslimah #FashionIndonesia #GamisCantik #WardrobeGoals #GamisKekinian #OutfitOfTheDay',t:'14:25'},
];

const SESSIONS = [
  {id:'1',agent:'ContentSpecialist',title:'Konten Instagram Koleksi Baru',last:'#GamisModern #OOTD...',t:'14:25',ch:'dashboard'},
  {id:'2',agent:'SEOAgent',title:'Analisis Backlink Kompetitor',last:'Domain authority rata-rata 34...',t:'13:40',ch:'telegram'},
  {id:'3',agent:'VPSManager',title:'Deploy POS Tool Node',last:'Deployment selesai, container normal',t:'12:31',ch:'dashboard'},
  {id:'4',agent:'KnowledgeBase',title:'Panduan Docker Multi-container',last:'Berikut struktur docker-compose...',t:'11:20',ch:'api'},
];

const CMDS = [
  {id:'1',cat:'Memory',name:'memory.export',desc:'Export memory entries ke Obsidian vault',params:[{n:'vault_path',t:'string',req:true,d:'Path ke Obsidian vault'},{n:'agent_id',t:'string',req:false,d:'Filter per agent (opsional)'}]},
  {id:'2',cat:'Memory',name:'memory.search',desc:'Cari memory dengan semantic search',params:[{n:'query',t:'string',req:true,d:'Query pencarian'},{n:'limit',t:'number',req:false,d:'Jumlah hasil (default 10)'}]},
  {id:'3',cat:'Tasks',name:'task.cancel',desc:'Batalkan task yang sedang berjalan',params:[{n:'task_id',t:'string',req:true,d:'ID task yang dibatalkan'}]},
  {id:'4',cat:'Tasks',name:'task.retry',desc:'Jalankan ulang task yang gagal',params:[{n:'task_id',t:'string',req:true,d:'ID task'},{n:'priority',t:'enum:low,normal,high,urgent',req:false,d:'Override prioritas'}]},
  {id:'5',cat:'Connections',name:'connection.test',desc:'Uji koneksi ke layanan eksternal',params:[{n:'connection_id',t:'string',req:true,d:'ID koneksi'}]},
  {id:'6',cat:'Connections',name:'connection.reconnect',desc:'Sambungkan ulang koneksi yang terputus',params:[{n:'connection_id',t:'string',req:true,d:'ID koneksi'}]},
  {id:'7',cat:'System',name:'hermes.status',desc:'Status detail semua komponen Hermes',params:[]},
  {id:'8',cat:'System',name:'hermes.reload',desc:'Reload konfigurasi tanpa restart agent',params:[]},
];

// ── Helpers ────────────────────────────────────────────────────────────────

const SB = {
  running:['bb','Running'], completed:['bg','Selesai'], failed:['br','Gagal'],
  queued:['bn','Antri'], cancelled:['by','Batal'],
  connected:['bg','Terhubung'], disconnected:['bn','Terputus'], error:['br','Error'],
};
const MB = {
  decision:['bp','Keputusan'], skill:['bb','Skill'], fact:['bg','Fakta'],
  context:['by','Konteks'], result:['ba','Hasil'],
};
const PB = {high:['br','High'],urgent:['br','Urgent'],normal:['bb','Normal'],low:['bn','Low']};

const Bdg = ({type, map}) => {
  const [c,l] = map[type] || ['bn', type];
  return <span className={`badge ${c}`}>{l}</span>;
};

const Dot = ({s}) => {
  const c = {connected:'dg',disconnected:'dn',error:'dr'}[s] || 'dn';
  return <span className={`dot ${c}`} />;
};

const HubIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="4" r="2" />
    <circle cx="12" cy="20" r="2" />
    <circle cx="4" cy="12" r="2" />
    <circle cx="20" cy="12" r="2" />
    <line x1="12" y1="7" x2="12" y2="9" />
    <line x1="12" y1="15" x2="12" y2="17" />
    <line x1="7" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="17" y2="12" />
  </svg>
);

const Label = ({txt}) => (
  <div style={{fontSize:11,color:'var(--t3)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>{txt}</div>
);

// ── Sidebar ────────────────────────────────────────────────────────────────

const NAV = [
  {id:'install',label:'Installation',Icon:Package},
  {id:'overview',label:'Overview',Icon:LayoutDashboard},
  {id:'insight',label:'Insights',Icon:Zap},
  {id:'status',label:'System Status',Icon:Activity},
  {id:'logs',label:'System Logs',Icon:FileTerminal},
  {id:'config',label:'Config',Icon:Settings},
  {id:'keys',label:'API Keys',Icon:Key},
  {id:'analytics',label:'Analytics',Icon:Brain},
  {id:'cron',label:'CRON Jobs',Icon:Clock},
  {id:'skills',label:'Agent Skills',Icon:Zap},
  {id:'search',label:'History Search',Icon:Search},
  {id:'memory',label:'Memory (Mock)',Icon:Archive},
  {id:'tasks',label:'Tasks (Mock)',Icon:CheckSquare},
  {id:'chat',label:'Chat',Icon:MessageSquare},
  {id:'connections',label:'Conns (Mock)',Icon:Zap},
  {id:'profiles',label:'Profiles',Icon:Users},
  {id:'router9',label:'9Router Usage',Icon:HubIcon},
  {id:'commands',label:'Commands',Icon:Command},
  {id:'docs',label:'Documentation',Icon:Book},
  {id:'ui',label:'UI System',Icon:Palette},
  {id:'settings',label:'Settings',Icon:Settings},
];


function Sidebar({page, setPage, col, setCol, showChat, setShowChat, showDocs, setShowDocs, onHover}) {
  return (
    <div className={`sb${col?' cl':''}`}>
      <div style={{
        padding:'0 14px',
        borderBottom:'1px solid var(--bd)',
        display:'flex',
        alignItems:'center',
        justifyContent: col ? 'center' : 'space-between',
        gap: col ? 0 : 10,
        overflow:'hidden',
        flexShrink:0,
        height: 'var(--hh)'
      }}>
        <div style={{width:30,height:30,borderRadius:4,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0, background: 'rgba(255,255,255,0.03)'}}>
          <img src="/logo.png" alt="Hermes" style={{width:'100%',height:'100%',objectFit:'contain', padding: 2}} onError={(e) => e.target.style.display = 'none'} />
        </div>



        
        {!col && (
          <div className="lbl" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{fontSize:14.5,fontWeight:600,color:'var(--t1)',lineHeight:1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>Hermes Luna</div>
            <div style={{fontSize:10.5,color:'var(--t3)',marginTop:2, whiteSpace: 'nowrap'}}>v0.1.0</div>
          </div>
        )}

        {!col && (
          <button 
            onClick={() => setCol(!col)} 
            style={{ 
              background: 'var(--s2)', 
              border: '1px solid var(--bd)', 
              color: 'var(--t2)', 
              cursor: 'pointer', 
              padding: '5px', 
              borderRadius: '6px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 26,
              height: 26,
              transition: 'all 0.2s',
              zIndex: 10
            }}
            title="Collapse"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      <div 
        style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        <div style={{flex:1,paddingTop:8,overflow:'hidden'}}>
          {NAV.map(({id,label,Icon}) => (
            <div key={id} className={`ni${page===id?' act':''}`} onClick={()=>setPage(id)} title={col?label:''}>
              <Icon size={16} style={{flexShrink:0}} />
              <span className="lbl">{label}</span>
              {id==='tasks' && !col && (
                <span className="badge bb" style={{padding:'1px 5px',fontSize:10,marginLeft:'auto'}}>1</span>
              )}
            </div>
          ))}
        </div>

        <div style={{borderTop:'1px solid var(--bd)',padding:'4px 7px',flexShrink:0, display: col ? 'none' : 'block'}}>
          <div style={{ padding: '8px 12px', fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Version v0.1.0
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────

const TITLES = {install:'Installation & Setup',overview:'Overview',status:'System Status',logs:'System Logs',config:'Config Editor',keys:'API Keys & Variables',analytics:'Usage Analytics',cron:'Scheduled Tasks',skills:'Agent Capability Modules',search:'Advanced FTS5 Search',memory:'Memory',tasks:'Tasks',chat:'Chat',connections:'Connections',profiles:'Profiles & Personality',router9:'9Router Usage',commands:'Commands',ui:'UI System'};


function Header({page, onLogout, onToggleChat, showChat, onToggleDocs, showDocs, col, setCol, onToggleCmd, onToggleCmdModal, showCmdModal}) {
  const ok = CONNS.filter(c=>c.status==='connected');
  const err = CONNS.filter(c=>c.status!=='connected').length;
  return (
    <div style={{height:'var(--hh)',display:'flex',alignItems:'center',padding:'0 18px',borderBottom:'1px solid var(--bd)',gap:10,background:'var(--s1)',flexShrink:0}}>
      {col && (
        <button 
          onClick={() => setCol(false)}
          style={{ 
            background: 'var(--s2)', 
            border: '1px solid var(--bd)', 
            color: 'var(--t2)', 
            cursor: 'pointer', 
            padding: '5px', 
            borderRadius: '6px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 5
          }}
          title="Expand Sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}
      <span style={{fontSize:14.5,fontWeight:500,color:'var(--t1)',marginRight:'auto'}}>{TITLES[page]}</span>
      <div style={{display:'flex',gap:5,alignItems:'center'}}>
        {ok.slice(0,3).map(c=>(
          <div key={c.id} className="cb">
            <Dot s={c.status} />
            <span>{c.name.split(' ')[0]}</span>
            <span className="mono" style={{fontSize:10,color:'var(--t3)'}}>{c.lat}ms</span>
          </div>
        ))}
        {err > 0 && (
          <div className="cb" style={{borderColor:'rgba(248,113,113,0.2)'}}>
            <span className="dot dr" />
            <span style={{color:'var(--re)'}}>{err} error</span>
          </div>
        )}
      </div>
      <button 
        className={`btn btg ${showDocs ? 'active' : ''}`} 
        style={{padding:'5px 9px', color: showDocs ? 'var(--ac)' : 'var(--t3)'}} 
        onClick={onToggleDocs} 
        title="Toggle Global Documentation (Ctrl+H)"
      >
        <Book size={13} />
      </button>
      <button 
        className={`btn btg ${showCmdModal ? 'active' : ''}`} 
        style={{padding:'5px 9px', color: showCmdModal ? 'var(--ac)' : 'var(--t3)'}} 
        onClick={onToggleCmdModal} 
        title="Toggle Quick Commands (Ctrl+J)"
      >
        <Terminal size={13} />
      </button>
      <button 
        className={`btn btg ${showChat ? 'active' : ''}`} 
        style={{padding:'5px 9px', color: showChat ? 'var(--ac)' : 'var(--t3)'}} 
        onClick={onToggleChat} 
        title="Toggle Global Chat (Ctrl+X)"
      >
        <MessageSquare size={13} />
      </button>
      <button className="btn btg" style={{padding:'5px 9px'}}><RefreshCw size={13}/></button>
      <button className="btn btg" style={{padding:'5px 9px'}} onClick={onToggleCmd} title="Search Commands (Ctrl+K)">
        <Search size={13}/>
      </button>
      {onLogout && (
        <button
          className="btn"
          title="Logout"
          onClick={onLogout}
          style={{padding:'5px 10px',fontSize:12,color:'var(--re)',background:'var(--red)',border:'1px solid rgba(248,113,113,0.2)'}}
        >
          Logout
        </button>
      )}
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────

function MCard({label,val,sub,hi}) {
  return (
    <div className="card" style={{padding:'15px 17px'}}>
      <div style={{fontSize:10.5,color:'var(--t3)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{label}</div>
      <div style={{fontSize:26,fontWeight:600,color:hi?'var(--ac)':'var(--t1)',lineHeight:1,letterSpacing:'-0.5px'}}>{val}</div>
      {sub && <div style={{fontSize:11.5,color:'var(--t3)',marginTop:5}}>{sub}</div>}
    </div>
  );
}

function Overview() {
  return (
    <div className="pg" style={{padding:18,display:'flex',flexDirection:'column',gap:18}}>
      <div style={{background:'rgba(251,191,36,0.05)',border:'1px solid rgba(251,191,36,0.13)',borderRadius:10,padding:'10px 15px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <AlertTriangle size={13} style={{color:'var(--ye)',flexShrink:0}} />
        <span style={{fontSize:12.5,color:'var(--ye)',fontWeight:500}}>Demo mode</span>
        <span style={{fontSize:12,color:'var(--t3)'}}>Hermes belum terinstall. Jalankan:</span>
        <code className="mono" style={{fontSize:11.5,background:'rgba(255,255,255,0.05)',padding:'2px 8px',borderRadius:5,color:'var(--ac)'}}>hermes install && hermes start</code>
        <span style={{fontSize:12,color:'var(--t3)'}}>untuk menghubungkan dashboard ke agent.</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <MCard label="Task Aktif" val="1" sub="1 running · 1 antri" hi />
        <MCard label="Selesai Hari Ini" val="3" sub="avg 7m 20s" />
        <MCard label="Memory Entries" val="6" sub="3 agents" />
        <MCard label="Connections" val="3/5" sub="2 error" />
      </div>

      <div>
        <Label txt="System Health" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {HEALTH.map(h=>(
            <div key={h.name} className="card" style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
              <span className={`dot ${h.ok?'dg':'dr'}`} />
              <span style={{fontSize:13,color:'var(--t1)',flex:1}}>{h.name}</span>
              <span className="mono" style={{fontSize:11,color:'var(--t3)'}}>{h.ms}ms</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label txt="Aktivitas Terbaru" />
        <div className="card">
          {TASKS.slice(0,4).map((t,i)=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 15px',borderBottom:i<3?'1px solid var(--bd)':'none'}}>
              {t.status==='running' && <Circle size={8} style={{color:'var(--bl)',flexShrink:0,animation:'blink 1.5s infinite'}} />}
              {t.status==='completed' && <CheckCircle size={13} style={{color:'var(--gr)',flexShrink:0}} />}
              {t.status==='failed' && <XCircle size={13} style={{color:'var(--re)',flexShrink:0}} />}
              {t.status==='queued' && <Clock size={13} style={{color:'var(--t3)',flexShrink:0}} />}
              <span style={{fontSize:13,color:'var(--t1)',flex:1}}>{t.title}</span>
              <span style={{fontSize:11.5,color:'var(--t3)',flexShrink:0}}>{t.agent}</span>
              <span style={{fontSize:11.5,color:'var(--t3)',flexShrink:0,minWidth:36}}>{t.created}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Memory ─────────────────────────────────────────────────────────────────

function MemoryPage() {
  const [q, setQ] = useState('');
  const [tf, setTf] = useState('all');
  const list = MEM.filter(m=>(tf==='all'||m.type===tf)&&(m.summary.toLowerCase().includes(q.toLowerCase())||m.agent.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="pg" style={{padding:18,display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:8}}>
        <div style={{position:'relative',flex:1}}>
          <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}} />
          <input placeholder="Cari atau tanya secara semantik..." style={{paddingLeft:32}} value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select style={{width:'auto',minWidth:130}} value={tf} onChange={e=>setTf(e.target.value)}>
          <option value="all">Semua tipe</option>
          <option value="fact">Fakta</option>
          <option value="decision">Keputusan</option>
          <option value="skill">Skill</option>
          <option value="context">Konteks</option>
          <option value="result">Hasil</option>
        </select>
        <button className="btn btg"><Archive size={13}/>Export Obsidian</button>
      </div>

      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {['decision','skill','fact','context','result'].map(t=>(
          <div key={t} onClick={()=>setTf(t===tf?'all':t)} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,border:'1px solid var(--bd)',cursor:'pointer',background:tf===t?'var(--acd)':'transparent'}}>
            <Bdg type={t} map={MB}/>
            <span style={{fontSize:11.5,color:'var(--t3)'}}>{MEM.filter(m=>m.type===t).length}</span>
          </div>
        ))}
      </div>

      <div className="card">
        {list.length===0 && <div style={{padding:32,textAlign:'center',color:'var(--t3)',fontSize:13}}>Tidak ada entry yang cocok</div>}
        {list.map((m,i)=>(
          <div key={m.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,padding:'13px 16px',borderBottom:i<list.length-1?'1px solid var(--bd)':'none',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.015)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                <Bdg type={m.type} map={MB}/>
                <span style={{fontSize:11.5,color:'var(--t3)'}}>{m.agent}</span>
              </div>
              <div style={{fontSize:13.5,color:'var(--t1)',marginBottom:7,lineHeight:1.4}}>{m.summary}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {m.tags.map(t=><span key={t} className="tp">#{t}</span>)}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,paddingTop:2}}>
              <div className="rbar"><div className="rbar-f" style={{width:`${m.rel*100}%`}} /></div>
              <span className="mono" style={{fontSize:10.5,color:'var(--t3)'}}>{Math.round(m.rel*100)}%</span>
              <span style={{fontSize:11,color:'var(--t3)'}}>{m.acc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tasks ──────────────────────────────────────────────────────────────────

function TasksPage() {
  const [sf, setSf] = useState('all');
  const list = TASKS.filter(t=>sf==='all'||t.status===sf);
  const ct = s => TASKS.filter(t=>t.status===s).length;
  const cols = {running:'var(--bl)',completed:'var(--gr)',failed:'var(--re)',queued:'var(--t2)'};
  return (
    <div className="pg" style={{padding:18,display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[['running','Aktif'],['completed','Selesai'],['failed','Gagal'],['queued','Antri']].map(([s,l])=>(
          <div key={s} className="card" style={{padding:'14px 16px',cursor:'pointer',borderColor:sf===s?`rgba(${s==='running'?'96,165,250':s==='completed'?'74,222,128':s==='failed'?'248,113,113':'255,255,255'},0.25)`:undefined}} onClick={()=>setSf(sf===s?'all':s)}>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{l}</div>
            <div style={{fontSize:26,fontWeight:600,color:cols[s],lineHeight:1}}>{ct(s)}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:6}}>
        {['all','running','completed','failed','queued'].map(s=>(
          <button key={s} className="btn" style={{padding:'5px 12px',fontSize:12,background:sf===s?'var(--acd)':'rgba(255,255,255,0.04)',color:sf===s?'var(--ac)':'var(--t2)',border:`1px solid ${sf===s?'rgba(94,234,212,0.2)':'var(--bd)'}`}} onClick={()=>setSf(s)}>
            {s==='all'?'Semua':s}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'1fr 130px 100px 80px 70px',padding:'9px 16px',borderBottom:'1px solid var(--bd)'}}>
          {['Task','Agent','Status','Prioritas','Durasi'].map(h=>(
            <span key={h} style={{fontSize:10.5,color:'var(--t3)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</span>
          ))}
        </div>
        {list.map(t=>(
          <div key={t.id} className="trow" style={{gridTemplateColumns:'1fr 130px 100px 80px 70px'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {t.status==='running' && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--bl)',display:'inline-block',animation:'blink 1.5s infinite',flexShrink:0}} />}
              <span style={{color:'var(--t1)'}}>{t.title}</span>
            </div>
            <span style={{color:'var(--t2)',fontSize:12.5}}>{t.agent}</span>
            <Bdg type={t.status} map={SB}/>
            <Bdg type={t.priority} map={PB}/>
            <span className="mono" style={{fontSize:11.5,color:'var(--t3)'}}>{t.dur||'—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Connections ────────────────────────────────────────────────────────────

function ConnPage() {
  const [tst, setTst] = useState(null);
  const test = id => { setTst(id); setTimeout(()=>setTst(null),1500); };
  return (
    <div className="pg" style={{padding:18,display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        <MCard label="Terhubung" val={CONNS.filter(c=>c.status==='connected').length} sub="dari 5 koneksi" hi/>
        <MCard label="Error" val={CONNS.filter(c=>c.status==='error').length} sub="perlu perhatian"/>
        <MCard label="Terputus" val={CONNS.filter(c=>c.status==='disconnected').length} sub=""/>
      </div>
      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'24px 1fr 110px 90px 90px 110px',padding:'9px 16px',borderBottom:'1px solid var(--bd)',gap:4}}>
          {['','Nama','Tipe','Status','Latency','Aksi'].map((h,i)=>(
            <span key={i} style={{fontSize:10.5,color:'var(--t3)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</span>
          ))}
        </div>
        {CONNS.map(c=>(
          <div key={c.id} className="trow" style={{gridTemplateColumns:'24px 1fr 110px 90px 90px 110px',gap:4}}>
            <Dot s={c.status}/>
            <span style={{color:'var(--t1)'}}>{c.name}</span>
            <span className="badge bn" style={{justifySelf:'start'}}>{c.type.replace('_',' ')}</span>
            <Bdg type={c.status} map={SB}/>
            <span className="mono" style={{fontSize:12,color:'var(--t3)'}}>{c.lat?`${c.lat}ms`:'—'}</span>
            <div style={{display:'flex',gap:4}}>
              <button className="btn btg" style={{padding:'4px 8px',fontSize:11}} onClick={()=>test(c.id)}>
                {tst===c.id ? <RefreshCw size={11} style={{animation:'spin 0.7s linear infinite'}}/> : 'Test'}
              </button>
              {c.status!=='connected' && <button className="btn btg" style={{padding:'4px 8px',fontSize:11}}>Ulang</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Commands ───────────────────────────────────────────────────────────────

function CmdsPage() {
  const [sel, setSel] = useState(CMDS[0]);
  const [params, setParams] = useState({});
  const [out, setOut] = useState(null);
  const cats = [...new Set(CMDS.map(c=>c.cat))];
  const run = () => setOut(`{\n  "ok": true,\n  "command": "${sel.name}",\n  "executed_at": "${new Date().toISOString()}",\n  "result": "Perintah berhasil dijalankan"\n}`);
  return (
    <div className="pg" style={{display:'grid',gridTemplateColumns:'210px 1fr',height:'calc(100vh - var(--hh) - 1px)'}}>
      <div style={{borderRight:'1px solid var(--bd)',overflowY:'auto',padding:'8px 5px'}}>
        {cats.map(cat=>(
          <div key={cat}>
            <div style={{fontSize:10,color:'var(--t3)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.09em',padding:'8px 12px 4px'}}>{cat}</div>
            {CMDS.filter(c=>c.cat===cat).map(c=>(
              <div key={c.id} className={`ni${sel.id===c.id?' act':''}`} onClick={()=>{setSel(c);setParams({});setOut(null);}}>
                <span className="lbl mono" style={{fontSize:12.5}}>{c.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:16}}>
        <div>
          <div className="mono" style={{fontSize:15,fontWeight:500,color:'var(--ac)',marginBottom:4}}>{sel.name}</div>
          <div style={{fontSize:13,color:'var(--t2)'}}>{sel.desc}</div>
        </div>
        {sel.params.length>0 && (
          <div className="card" style={{padding:16,display:'flex',flexDirection:'column',gap:13}}>
            <Label txt="Parameter"/>
            {sel.params.map(p=>(
              <div key={p.n}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                  <span className="mono" style={{fontSize:12.5,color:'var(--t1)',fontWeight:500}}>{p.n}</span>
                  {p.req ? <span className="badge br" style={{fontSize:10}}>wajib</span> : <span className="badge bn" style={{fontSize:10}}>opsional</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Hermes Luna v0.1.0</div>
                <div style={{fontSize:11.5,color:'var(--t3)',marginBottom:6}}>{p.d}</div>
                {p.t.startsWith('enum:')
                  ? <select value={params[p.n]||''} onChange={e=>setParams({...params,[p.n]:e.target.value})} style={{width:'auto'}}>
                      <option value="">Pilih nilai...</option>
                      {p.t.replace('enum:','').split(',').map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  : <input type={p.t==='number'?'number':'text'} placeholder={p.n} value={params[p.n]||''} onChange={e=>setParams({...params,[p.n]:e.target.value})} />
                }
              </div>
            ))}
          </div>
        )}
        <button className="btn btp" style={{alignSelf:'flex-start'}} onClick={run}>
          <Play size={13}/>Jalankan
        </button>
        {out && (
          <div className="card" style={{padding:15}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <Label txt="Output"/>
              <button className="btn btg" style={{padding:'3px 8px',fontSize:11}}><Copy size={11}/>Copy</button>
            </div>
            <pre className="mono" style={{fontSize:12,color:'var(--ac)',background:'rgba(94,234,212,0.04)',border:'1px solid rgba(94,234,212,0.1)',borderRadius:8,padding:12,margin:0,whiteSpace:'pre-wrap',lineHeight:1.7}}>{out}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState('insight');
  const [col, setCol] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('hermes_token') || '');
  const [showChat, setShowChat] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [showCmdModal, setShowCmdModal] = useState(false);

  useEffect(() => {
    const handleKD = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setShowCmd(prev => !prev);
        } else if (e.key === 'j') {
          e.preventDefault();
          setShowCmdModal(prev => !prev);
        } else if (e.key === 'h') {
          e.preventDefault();
          setShowDocs(prev => !prev);
        } else if (e.key === 'x') {
          e.preventDefault();
          setShowChat(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKD);
    return () => window.removeEventListener('keydown', handleKD);
  }, []);

  const isMini = col && !hovered;

  const handleLogin = (t) => setToken(t);
  const handleLogout = () => {
    localStorage.removeItem('hermes_token');
    setToken('');
  };

  // Tampilkan halaman login jika belum ada token
  if (!token) {
    return (
      <>
        <style>{G}</style>
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  const pages = {install:<InstallationPage/>,insight:<InsightPage/>,overview:<Overview/>,status:<StatusPage/>,logs:<LogsPage/>,config:<ConfigPage/>,keys:<KeysPage/>,analytics:<AnalyticsPage/>,cron:<CronPage/>,skills:<SkillsPage/>,search:<SessionsSearchPage/>,memory:<MemoryPage/>,tasks:<TasksPage/>,connections:<ConnPage/>,profiles:<ProfilesPage/>,router9:<Router9UsagePage/>,commands:<CommandsPage/>,docs:<DocsPage/>,settings:<SettingsPage/>,ui:<UIPage/>};

  return (
    <>
      <style>{G}</style>
      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>
        <Sidebar 
          page={page} 
          setPage={setPage} 
          col={isMini} 
          setCol={setCol} 
          showChat={showChat} 
          setShowChat={setShowChat} 
          showDocs={showDocs} 
          setShowDocs={setShowDocs}
          onHover={setHovered}
        />
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          <Header 
            page={page} 
            onLogout={handleLogout} 
            onToggleChat={() => setShowChat(!showChat)} 
            showChat={showChat}
            onToggleDocs={() => setShowDocs(!showDocs)}
            showDocs={showDocs}
            col={isMini}
            setCol={setCol}
            onToggleCmd={() => setShowCmd(!showCmd)}
            onToggleCmdModal={() => setShowCmdModal(!showCmdModal)}
            showCmdModal={showCmdModal}
          />
          <div style={{flex:1,overflow:'auto',background:'var(--bg)',position:'relative'}}>
            {pages[page]}
            <div style={{display:page==='chat'?'block':'none',height:'100%'}}><ChatPage/></div>
          </div>
        </div>
      </div>
      {showChat && (
        <FloatingChatModal 
          isOpen={showChat} 
          onClose={() => setShowChat(false)} 
          page={page}
          initialRight={showDocs ? (520 + 20 + 16) : 20}
        />
      )}

      {showDocs && (
        <FloatingDocsModal 
          isOpen={showDocs} 
          onClose={() => setShowDocs(false)} 
          page={page}
          initialRight={20}
        />
      )}

      {showCmdModal && (
        <FloatingCommandModal 
          isOpen={showCmdModal} 
          onClose={() => setShowCmdModal(false)}
          page={page}
          initialRight={(showDocs ? 520 + 16 : 0) + (showChat ? 450 + 16 : 0) + 20}
        />
      )}

      <CommandPalette 
        isOpen={showCmd} 
        onClose={() => setShowCmd(false)} 
        items={[
          ...NAV,
          { id: 'toggle_chat', label: `${showChat ? 'Hide' : 'Show'} Global Chat`, Icon: MessageSquare },
          { id: 'toggle_docs', label: `${showDocs ? 'Hide' : 'Show'} Floating Documentation`, Icon: Book },
        ]} 
        onSelect={(id) => {
          if (id === 'toggle_chat') setShowChat(prev => !prev);
          else if (id === 'toggle_docs') setShowDocs(prev => !prev);
          else setPage(id);
        }} 
      />
    </>
  );
}