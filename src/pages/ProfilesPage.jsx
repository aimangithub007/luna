import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle, 
  RefreshCw,
  FileText, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Save,
  X,
  Layout,
  UserPlus
} from 'lucide-react';
import { api } from '../lib/api';
import { fuzzySearch } from '../lib/utils';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [cloneFromDefault, setCloneFromDefault] = useState(true);
  const [creating, setCreating] = useState(false);

  const [editingSoul, setEditingSoul] = useState(null);
  const [soulContent, setSoulContent] = useState('');
  const [savingSoul, setSavingSoul] = useState(false);

  const [renamingProfile, setRenamingProfile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const [activeProfilePath, setActiveProfilePath] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesData, statusData] = await Promise.all([
        api.getProfiles(),
        api.getStatus()
      ]);
      const profs = profilesData.profiles || profilesData;
      setProfiles(Array.isArray(profs) ? profs : []);
      setActiveProfilePath(statusData.hermes_home || '');
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUseProfile = async (name) => {
    try {
      await api.useProfile(name);
      await fetchData();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.createProfile(newName.trim(), cloneFromDefault);
      setShowCreateModal(false);
      setNewName('');
      await fetchData();
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (name) => {
    if (!renameValue.trim() || renameValue === name) {
      setRenamingProfile(null);
      return;
    }
    try {
      await api.renameProfile(name, renameValue.trim());
      setRenamingProfile(null);
      await fetchData();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const handleDelete = async (name) => {
    if (!confirm(`Delete profile "${name}"?`)) return;
    try {
      await api.deleteProfile(name);
      await fetchData();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const handleCopyCommand = async (name) => {
    try {
      const { command } = await api.getProfileSetupCommand(name);
      await navigator.clipboard.writeText(command);
      alert('Copied!');
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const handleEditSoul = async (p) => {
    setEditingSoul(p);
    setSoulContent('Loading...');
    try {
      const data = await api.getProfileSoul(p.name);
      setSoulContent(data.content || '');
    } catch (error) {
      setSoulContent('# Error loading SOUL.md');
    }
  };

  const handleSaveSoul = async () => {
    if (!editingSoul) return;
    setSavingSoul(true);
    try {
      await api.updateProfileSoul(editingSoul.name, soulContent);
      setEditingSoul(null);
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setSavingSoul(false);
    }
  };

  const filteredProfiles = fuzzySearch(searchQuery, profiles, ['name', 'model', 'path']);

  if (loading && profiles.length === 0) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
        <RefreshCw className="spin" style={{color:'var(--t3)'}} />
      </div>
    );
  }

  return (
    <div className="pg" style={{padding:24, display:'flex', flexDirection:'column', gap:24}}>
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:22, fontWeight:700, color:'var(--t1)', display:'flex', alignItems:'center', gap:10}}>
            <Users style={{color:'var(--ac)'}} size={24} />
            Profiles
            <span style={{fontSize:14, fontWeight:400, color:'var(--t3)'}}>({profiles.length})</span>
          </div>
          <div style={{fontSize:13, color:'var(--t3)', marginTop:4}}>Manage multiple Hermes identities and their worldviews.</div>
        </div>
        <div style={{display:'flex', gap:12}}>
          <div style={{position:'relative', width:260}}>
            <Search size={14} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)'}} />
            <input 
              style={{paddingLeft:36}}
              placeholder="Fuzzy search profiles..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btp" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            CREATE
          </button>
        </div>
      </div>

      {/* Profile List */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {filteredProfiles.map((p) => {
          const isActive = activeProfilePath === p.path || (p.is_default && activeProfilePath.endsWith('.hermes'));
          return (
            <div 
              key={p.name}
              className="card"
              style={{
                padding: '16px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 20,
                borderColor: isActive ? 'var(--acb)' : 'var(--bd)',
                background: isActive ? 'var(--acd)' : 'var(--s1)',
                position: 'relative'
              }}
            >
              {/* Icon */}
              <div style={{
                width:42, height:42, borderRadius:12, 
                background: isActive ? 'var(--ac)' : 'var(--s2)', 
                color: isActive ? '#000' : 'var(--t3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {isActive ? <CheckCircle size={22} /> : <Layout size={22} />}
              </div>

              {/* Info Area (Stacked rows) */}
              <div style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:6}}>
                {/* Top Row: Name & Badges */}
                <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
                  {renamingProfile === p.name ? (
                    <div style={{display:'flex', alignItems:'center', gap:5}}>
                      <input 
                        autoFocus
                        style={{fontSize:13, padding:'4px 8px', width:180}}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if(e.key === 'Enter') handleRename(p.name);
                          if(e.key === 'Escape') setRenamingProfile(null);
                        }}
                      />
                      <button onClick={() => handleRename(p.name)} style={{color:'var(--ac)', background:'none', border:'none', cursor:'pointer'}}><CheckCircle size={16}/></button>
                      <button onClick={() => setRenamingProfile(null)} style={{color:'var(--re)', background:'none', border:'none', cursor:'pointer'}}><X size={16}/></button>
                    </div>
                  ) : (
                    <span style={{fontSize:16, fontWeight:600, color:isActive?'var(--ac)':'var(--t1)'}} className="mono">{p.name}</span>
                  )}
                  
                  <div style={{display:'flex', gap:6}}>
                    {p.is_default && <span className="badge ba" style={{fontSize:9}}>DEFAULT</span>}
                    {p.has_env && <span className="badge bg" style={{fontSize:9}}>ENV</span>}
                    {p.is_default && <span className="badge bb" style={{fontSize:9}}>CORE</span>}
                  </div>
                </div>

                {/* Bottom Row: Details & Path */}
                <div style={{display:'flex', alignItems:'center', gap:20, flexWrap:'wrap'}}>
                  <div style={{display:'flex', gap:6, fontSize:11.5, color:'var(--t3)'}}>
                    <span style={{fontWeight:600}}>Model:</span>
                    <span style={{color:'var(--t2)'}}>{p.model || 'Default'}</span>
                  </div>
                  <div style={{display:'flex', gap:6, fontSize:11.5, color:'var(--t3)'}}>
                    <span style={{fontWeight:600}}>Skills:</span>
                    <span style={{color:'var(--t2)'}}>{p.skill_count} active</span>
                  </div>
                  <div style={{display:'flex', gap:6, fontSize:11.5, color:'var(--t3)', flex:1, minWidth:200}}>
                    <span style={{color:'var(--t3)'}} className="mono truncate">{p.path}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{display:'flex', alignItems:'center', gap:4}}>
                {!isActive && (
                  <button className="btn btg" onClick={() => handleUseProfile(p.name)} title="Switch Profile" style={{padding:8}}>
                    <ChevronRight size={16} />
                  </button>
                )}
                <button className="btn btg" onClick={() => handleEditSoul(p)} title="SOUL Editor" style={{padding:8}}>
                  <FileText size={16} />
                </button>
                <button className="btn btg" onClick={() => handleCopyCommand(p.name)} title="Copy Setup Command" style={{padding:8}}>
                  <Terminal size={16} />
                </button>
                <button className="btn btg" onClick={() => { setRenamingProfile(p.name); setRenameValue(p.name); }} title="Rename" style={{padding:8}}>
                  <Pencil size={16} />
                </button>
                {!p.is_default && (
                  <button className="btn btg" onClick={() => handleDelete(p.name)} title="Delete" style={{padding:8, color:'var(--re)'}}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Create */}
      {showCreateModal && (
        <div style={{position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
          <div className="card" style={{width:'100%', maxWidth:400, padding:24, display:'flex', flexDirection:'column', gap:20, boxShadow:'0 20px 40px rgba(0,0,0,0.4)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div style={{fontSize:18, fontWeight:600, display:'flex', alignItems:'center', gap:10}}>
                <UserPlus size={20} style={{color:'var(--ac)'}} />
                Create Profile
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{background:'none', border:'none', color:'var(--t3)', cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <label style={{fontSize:12, fontWeight:500, color:'var(--t2)'}}>Profile Name</label>
                <input 
                  autoFocus
                  placeholder="e.g. specialized-agent"
                  value={newName}
                  onChange={e => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                />
              </div>
              <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}}>
                <input 
                  type="checkbox" 
                  style={{width:16, height:16, margin:0}}
                  checked={cloneFromDefault}
                  onChange={e => setCloneFromDefault(e.target.checked)}
                />
                <span style={{fontSize:13, color:'var(--t2)'}}>Clone from default profile</span>
              </label>
            </div>
            <div style={{display:'flex', gap:10}}>
              <button className="btn btg" style={{flex:1}} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btp" style={{flex:1}} onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Soul Editor */}
      {editingSoul && (
        <div style={{position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:30}}>
          <div className="card" style={{width:'100%', maxWidth:900, height:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 30px 60px rgba(0,0,0,0.5)'}}>
             <div style={{padding:'16px 24px', background:'var(--s2)', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <FileText size={20} style={{color:'var(--ac)'}} />
                  <div>
                    <div style={{fontSize:16, fontWeight:600}}>{editingSoul.name}'s SOUL.md</div>
                    <div style={{fontSize:11, color:'var(--t3)'}}>Define the identity and values for this profile.</div>
                  </div>
                </div>
                <button onClick={() => setEditingSoul(null)} style={{background:'none', border:'none', color:'var(--t3)', cursor:'pointer'}}><X size={20}/></button>
             </div>
             <div style={{flex:1, padding:20}}>
                <textarea 
                  style={{width:'100%', height:'100%', resize:'none', padding:20, background:'rgba(0,0,0,0.2)', border:'1px solid var(--bd)', borderRadius:12, fontSize:14}}
                  className="mono"
                  value={soulContent}
                  onChange={e => setSoulContent(e.target.value)}
                />
             </div>
             <div style={{padding:'16px 24px', background:'var(--s2)', borderTop:'1px solid var(--bd)', display:'flex', justifyContent:'flex-end', gap:12}}>
                <button className="btn btg" onClick={() => setEditingSoul(null)}>Cancel</button>
                <button className="btn btp" onClick={handleSaveSoul} disabled={savingSoul}>
                  <Save size={16} />
                  {savingSoul ? 'Saving...' : 'Save Personality'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
