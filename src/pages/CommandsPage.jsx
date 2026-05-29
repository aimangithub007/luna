import { useState, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { api } from "../lib/api";

export function CommandsPage() {
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCommands()
      .then(data => {
        setSections(data.sections || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load commands:", err);
        setLoading(false);
      });
  }, []);

  const fuzzyMatch = (str, pattern) => {
    pattern = pattern.toLowerCase();
    str = str.toLowerCase();
    let i = 0, j = 0;
    while (i < str.length && j < pattern.length) {
      if (str[i] === pattern[j]) j++;
      i++;
    }
    return j === pattern.length;
  };

  const filteredSections = sections.map(section => {
    const q = search.toLowerCase();
    if (!q) return section;

    const filteredCommands = section.commands.map(cmd => {
      const name = (cmd.name || "").toLowerCase();
      const cleanName = name.startsWith('/') ? name.substring(1) : name;
      const desc = (cmd.desc || "").toLowerCase();
      
      let score = -1;
      if (name === q || cleanName === q) score = 1000;
      else if (name.includes(q) || cleanName.includes(q)) score = 500;
      else if (fuzzyMatch(name, q) || fuzzyMatch(cleanName, q)) score = 100;
      else if (desc.includes(q)) score = 10;
      
      return { ...cmd, searchScore: score };
    })
    .filter(c => c.searchScore > -1)
    .sort((a, b) => b.searchScore - a.searchScore);


    return { ...section, commands: filteredCommands };
  }).filter(section => section.commands.length > 0);


  return (
    <div className="pg" style={{padding: 20, display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15}}>
        <div>
          <div style={{fontSize: 22, color: 'var(--t1)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10}}>
            <Command size={24} className="ba" style={{padding: 4, borderRadius: 6}} />
            Hermes Commands
          </div>
          <div style={{fontSize: 13, color: 'var(--t3)', marginTop: 4}}>
            Explore and search all available slash commands and skill utilities.
          </div>
        </div>
        <div style={{position: 'relative', width: '100%', maxWidth: 400}}>
          <Search size={16} style={{position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)'}} />
          <input 
            type="text" 
            placeholder="Search commands or descriptions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{paddingLeft: 38, height: 42, background: 'var(--s1)', border: '1px solid var(--bd2)'}}
          />
        </div>
      </div>

      {loading ? (
        <div style={{padding: 40, textAlign: 'center', color: 'var(--t3)'}}>Loading commands...</div>
      ) : filteredSections.length > 0 ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
          {filteredSections.map(section => (
            <div key={section.name}>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid var(--bd)'
              }}>
                <div style={{fontSize: 14, fontWeight: 700, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  {section.name}
                </div>
                <div className="badge bn" style={{fontSize: 10}}>{section.commands.length}</div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 12}}>
                {section.commands.map((cmd, i) => (
                  <div key={i} className="card" style={{padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, transition: '0.2s', cursor: 'default'}} 
                       onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--bd2)'}
                       onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--bd)'}>
                    <div className="mono" style={{fontSize: 14, fontWeight: 600, color: 'var(--t1)'}}>
                      {cmd.name.startsWith('/') ? (
                        <span style={{color: 'var(--ac)'}}>{cmd.name}</span>
                      ) : (
                        cmd.name
                      )}
                    </div>
                    <div style={{fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5}}>
                      {cmd.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{padding: 60, textAlign: 'center', background: 'var(--s1)', borderRadius: 12, border: '1px dashed var(--bd)'}}>
          <div style={{fontSize: 16, color: 'var(--t2)'}}>No commands found matching "{search}"</div>
          <button onClick={() => setSearch("")} className="btn btg" style={{marginTop: 12}}>Clear Search</button>
        </div>
      )}
    </div>
  );
}
