import { useState, useEffect, useRef } from "react";
import { 
  Book, ChevronRight, ChevronDown, Search, X, 
  FileText, ExternalLink, Hash, CornerDownRight, RefreshCw,
  Cpu, Layout, Globe, Zap
} from "lucide-react";
import { api } from "../lib/api";

export function DocsViewer({ mini = false, initialMode = "docs" }) {
  const [mode, setMode] = useState(initialMode); // docs | skills
  const [topics, setTopics] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [targetAnchor, setTargetAnchor] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [skillSearch, setSkillSearch] = useState("");
  const [skillCategory, setSkillCategory] = useState("all");
  const [storyCategory, setStoryCategory] = useState("all");

  const searchInputRef = useRef(null);

  useEffect(() => {
    loadInitialData();

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function loadInitialData() {
    await Promise.all([loadTopics(), loadSkills(), loadUserStories()]);
  }

  async function loadTopics() {
    try {
      const resp = await api.getDocTopics();
      const sections = resp.sections || [];
      setTopics(sections);
      
      if (!activeDoc && sections.length > 0) {
        // Default to "User Stories" hub as landing page
        setActiveDoc("user-stories");
      }
    } catch (e) {
      console.error("Failed to load topics", e);
    }
  }

  async function loadSkills() {
    try {
      const resp = await api.getDocsSkills();
      setSkills(resp.skills || []);
    } catch (e) {
      console.error("Failed to load skills", e);
    }
  }

  async function loadUserStories() {
    try {
      const resp = await api.getUserStories();
      setUserStories(resp.stories || []);
    } catch (e) {
      console.error("Failed to load user stories", e);
    }
  }

  useEffect(() => {
    if (activeDoc) {
      loadContent(activeDoc);
    }
  }, [activeDoc]);

  useEffect(() => {
    if (targetAnchor && !loading && content) {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const el = document.getElementById(targetAnchor);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTargetAnchor(null);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [content, loading, targetAnchor]);

  async function loadContent(id) {
    setLoading(true);
    try {
      const resp = await api.getDocContent(id);
      setContent(resp.content || "");
    } catch (e) {
      setContent(`# Error\nFailed to load document: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(q) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const resp = await api.searchDocs(q);
      setSearchResults(resp.results || []);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  }

  function toggleExpand(label) {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  }

  // Simplified Markdown renderer helper
  function renderMarkdown(md) {
    if (!md) return null;
    const lines = md.split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith("|") && line.includes("|")) {
        const headers = line.split("|").filter(x => x.trim()).map(x => x.trim());
        i++; if (i < lines.length && lines[i].includes("---")) i++;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          rows.push(lines[i].split("|").filter(x => x.trim()).map(x => x.trim()));
          i++;
        }
        elements.push(
          <div key={`table-${i}`} className="table-wrapper">
            <table>
              <thead><tr>{headers.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
              <tbody>{rows.map((row, rj) => (<tr key={rj}>{row.map((cell, cj) => <td key={cj}>{cell}</td>)}</tr>))}</tbody>
            </table>
          </div>
        );
        continue;
      }
      if (line.startsWith("# ")) {
        const text = line.substring(2);
        elements.push(<h1 key={i} id={slugify(text)}>{text}</h1>);
      } else if (line.startsWith("## ")) {
        const text = line.substring(3);
        elements.push(<h2 key={i} id={slugify(text)}>{text}</h2>);
      } else if (line.startsWith("### ")) {
        const text = line.substring(4);
        elements.push(<h3 key={i} id={slugify(text)}>{text}</h3>);
      }
      else if (line.startsWith("```")) {
        const lang = line.substring(3).trim();
        let code = ""; i++;
        while (i < lines.length && !lines[i].startsWith("```")) { code += lines[i] + "\n"; i++; }
        elements.push(<div key={i} className="code-block">{lang && <div className="code-lang">{lang}</div>}<pre><code>{code}</code></pre></div>);
      }
      else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) elements.push(<li key={i} className="md-li">{line.trim().substring(2)}</li>);
      else if (line.trim()) elements.push(<p key={i}>{line}</p>);
      i++;
    }
    return <div className="md-content">{elements}</div>;
  }

  const CATEGORY_ICONS = {
    apple: "", "autonomous-ai-agents": "🤖", communication: "💬", creative: "🎨", "data-science": "📊", devops: "⚙️", github: "💻", health: "❤️", "note-taking": "📝", productivity: "✅", research: "🔍", "software-development": "💻", other: "📦"
  };

  const SOURCE_CONFIG = {
    "built-in": { label: "Built-in", color: "#4ade80", bg: "rgba(74, 222, 128, 0.08)", border: "rgba(74, 222, 128, 0.2)", icon: "✓" },
    "optional": { label: "Optional", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.08)", border: "rgba(251, 191, 36, 0.2)", icon: "⭐" },
    "Anthropic": { label: "Anthropic", color: "#d4845a", bg: "rgba(212, 132, 90, 0.08)", border: "rgba(212, 132, 90, 0.2)", icon: "◆" },
    "LobeHub": { label: "LobeHub", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.08)", border: "rgba(96, 165, 250, 0.2)", icon: "○" },
    "community": { label: "Community", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.08)", border: "rgba(167, 139, 250, 0.2)", icon: "👥" }
  };

  const STORY_CATEGORIES = {
    "dev-workflow": { label: "Dev Workflow", solid: "#60a5fa" },
    "personal-assistant": { label: "Personal Assistant", solid: "#34d399" },
    "content-creation": { label: "Content Creation", solid: "#f472b6" },
    "business-ops": { label: "Business Ops", solid: "#fb923c" },
    "research": { label: "Research", solid: "#a78bfa" },
    "creative": { label: "Creative", solid: "#f87171" },
    "integrations": { label: "Integrations", solid: "#38bdf8" },
    "general": { label: "General", solid: "#9ca3af" }
  };

  function renderSkillHub() {
    const filtered = skills.filter(s => {
      if (skillCategory !== "all" && s.category !== skillCategory) return false;
      if (skillSearch) {
        const q = skillSearch.toLowerCase();
        return (s.name + s.description).toLowerCase().includes(q);
      }
      return true;
    });

    const categories = Array.from(new Set(skills.map(s => s.category))).sort();

    return (
      <div className={`hub-wrap ${mini ? 'mini' : ''}`}>
        <header className="hub-hero">
          {!mini && <div className="hero-glow" />}
          <div className="hero-content">
            {!mini && <p className="hero-eyebrow">Hermes Agent</p>}
            <h1 className="hero-title">{mini ? 'Skills' : 'Skills Hub'}</h1>
            {!mini && <p className="hero-sub">Discover, search, and install from <strong>{skills.length}</strong> skills</p>}
            
            {!mini && (
              <div className="stats-row">
                <div className="stat-card" style={{ color: "#4ade80" }}>
                  <div className="stat-val">{skills.filter(s => s.source === 'built-in').length}</div>
                  <div className="stat-lbl">Built-in</div>
                </div>
                <div className="stat-card" style={{ color: "#fbbf24" }}>
                  <div className="stat-val">{skills.filter(s => s.source === 'optional').length}</div>
                  <div className="stat-lbl">Optional</div>
                </div>
                <div className="stat-card" style={{ color: "#60a5fa" }}>
                  <div className="stat-val">{skills.filter(s => s.source !== 'built-in' && s.source !== 'optional').length}</div>
                  <div className="stat-lbl">Community</div>
                </div>
              </div>
            )}

            <div className="hero-search">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search skills..." 
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="hub-layout">
          {!mini && (
            <aside className="hub-sidebar">
              <h3>Categories</h3>
              <div className="hub-cat-list">
                <button 
                  className={`hub-cat-item ${skillCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSkillCategory('all')}
                >
                  All Skills <span>{skills.length}</span>
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    className={`hub-cat-item ${skillCategory === cat ? 'active' : ''}`}
                    onClick={() => setSkillCategory(cat)}
                  >
                    {CATEGORY_ICONS[cat] || "📦"} {cat.replace(/-/g, ' ').titleCase()}
                    <span>{skills.filter(s => s.category === cat).length}</span>
                  </button>
                ))}
              </div>
            </aside>
          )}
          
          <main className="hub-grid">
            {filtered.map((s, i) => {
              const src = SOURCE_CONFIG[s.source] || SOURCE_CONFIG.community;
              return (
                <div key={i} className="skill-card" onClick={() => { if(s.link) setActiveDoc(s.link); setMode("docs"); }}>
                  <div className="skill-accent" style={{ background: src.color }} />
                  <div className="skill-body">
                    <div className="skill-top">
                      <span className="skill-icon">{CATEGORY_ICONS[s.category] || "📦"}</span>
                      <div className="skill-title-grp">
                        <h4>{s.name}</h4>
                        <span className="source-badge" style={{ color: src.color, background: src.bg, borderColor: src.border }}>
                          {src.icon} {src.label}
                        </span>
                      </div>
                    </div>
                    {!mini && <p className="skill-desc">{s.description}</p>}
                    {!mini && (
                      <div className="skill-meta">
                        <span className="cat-tag">{s.categoryLabel}</span>
                        {s.platforms?.map(p => (
                          <span key={p} className="plat-tag">{p === 'macos' ? '' : '🐧'} {p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </main>
        </div>
      </div>
    );
  }

  function renderUserStoriesHub() {
    const categories = Array.from(new Set(userStories.map(s => s.category))).filter(Boolean);
    const visibleStories = userStories.filter(s => {
      if (storyCategory !== "all" && s.category !== storyCategory) return false;
      if (skillSearch && !(s.headline + s.quote).toLowerCase().includes(skillSearch.toLowerCase())) return false;
      return true;
    });

    return (
      <div className={`hub-wrap ${mini ? 'mini' : ''}`}>
        <header className="hub-hero">
          {!mini && <div className="hero-glow" />}
          <div className="hero-content" style={{ textAlign: mini ? "left" : "center" }}>
            <h1 className="hero-title" style={{ fontSize: mini ? "1.5rem" : "3.5rem", letterSpacing: "-2px" }}>User Stories & Use Cases</h1>
            {!mini && <p className="hero-sub">What the Hermes Agent community is actually building.</p>}
            {!mini && (
              <div className="stats-row" style={{ justifyContent: "center" }}>
                <span><strong>{userStories.length}</strong> stories</span>
                <span><strong>{categories.length}</strong> categories</span>
              </div>
            )}
            <div className="hero-search" style={{ maxWidth: mini ? "100%" : "600px", margin: mini ? "0" : "0 auto" }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search user stories..." 
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {!mini && (
          <div className="story-filters">
            <button 
              className={`filter-btn ${storyCategory === 'all' ? 'active' : ''}`}
              onClick={() => setStoryCategory('all')}
            >All</button>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`filter-btn ${storyCategory === cat ? 'active' : ''}`}
                onClick={() => setStoryCategory(cat)}
              >
                {STORY_CATEGORIES[cat]?.label || cat}
              </button>
            ))}
          </div>
        )}

        <div className="collage-grid">
          {visibleStories.map(s => {
            const cat = STORY_CATEGORIES[s.category] || STORY_CATEGORIES.general;
            return (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="story-tile">
                <div className="story-badge-row">
                   <span className="story-cat" style={{ color: cat.solid }}>{cat.label}</span>
                   <span className="story-src">{s.source}</span>
                </div>
                <h3>{s.headline}</h3>
                {!mini && <p>&ldquo;{s.quote}&rdquo;</p>}
                {!mini && (
                  <div className="story-footer">
                    {s.author} {s.date && `· ${s.date}`}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`docs-viewer ${mini ? 'mini' : ''}`}>
      <div className="dv-header">
        <nav>
          <button 
            className={mode === "docs" ? "active" : ""} 
            onClick={() => { setMode("docs"); setActiveDoc("user-stories"); }}
          >
            Docs
          </button>
          <button 
            className={mode === "skills" ? "active" : ""} 
            onClick={() => { setMode("skills"); setActiveDoc(null); }}
          >
            Skills
          </button>
        </nav>
      </div>

      <div className="dv-body">
        <aside className="dv-sidebar">
          <div className="dv-search">
            <Search size={14} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery.length >= 2 && (
              <div className="dv-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map(res => (
                    <div 
                      key={res.type === 'command' ? `${res.id}-${res.anchor}` : res.id} 
                      className="dv-search-item" 
                      onClick={() => { 
                        setActiveDoc(res.id); 
                        if (res.anchor) setTargetAnchor(res.anchor);
                        setSearchQuery(""); 
                        setMode("docs"); 
                      }}
                    >
                      <div className="dv-search-item-main">
                        {res.type === 'command' ? <Hash size={12} /> : <FileText size={12} />}
                        <span>{res.title}</span>
                      </div>
                      {res.type === 'command' && (
                        <div className="dv-search-item-meta">
                          in {res.parent_title}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="dv-search-none">
                    {isSearching ? "Searching..." : "No results found"}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="dv-scroll">
            {mode === "docs" ? (
              topics.map((section, idx) => (
                <div key={idx}>
                  {section.type === "category" ? (
                    <div>
                      <div onClick={() => toggleExpand(section.label)} className="dv-cat">
                        {section.label}
                        {expanded[section.label] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </div>
                      {expanded[section.label] && section.items.map(item => (
                        <div key={item} className={`dv-item ${activeDoc === item ? 'active' : ''}`} onClick={() => setActiveDoc(item)}>
                          {item.split('/').pop().replace(/-/g, ' ').titleCase()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`dv-item ${activeDoc === section.id ? 'active' : ''}`} onClick={() => setActiveDoc(section.id)}>
                      {section.id.split('/').pop().replace(/-/g, ' ').titleCase()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              skills.map(skill => (
                <div key={skill.name} className={`dv-item ${activeDoc === skill.link ? 'active' : ''}`} onClick={() => setActiveDoc(skill.link)}>
                  {skill.name}
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="dv-content">
          {loading && <div className="dv-loader"><RefreshCw size={24} /></div>}
          <div className="dv-md-wrap">
             {mode === "skills" && !activeDoc ? renderSkillHub() : 
              (activeDoc === "user-stories" ? renderUserStoriesHub() : renderMarkdown(content))}
          </div>
        </main>
      </div>

      <style>{`
        .docs-viewer { display: flex; flex-direction: column; height: 100%; background: var(--bg); overflow: hidden; }
        .dv-header { height: 40px; border-bottom: 1px solid var(--bd); display: flex; align-items: center; padding: 0 16px; background: var(--s1); }
        .dv-header nav { display: flex; gap: 16px; }
        .dv-header nav button { background: none; border: none; font-size: 13px; color: var(--t3); cursor: pointer; padding: 4px 0; position: relative; }
        .dv-header nav button.active { color: var(--ac); font-weight: 600; }
        .dv-header nav button.active::after { content: ""; position: absolute; bottom: -8px; left: 0; right: 0; height: 2px; background: var(--ac); }

        .dv-body { display: flex; flex: 1; overflow: hidden; }
        .dv-sidebar { width: 220px; border-right: 1px solid var(--bd); background: var(--s1); display: flex; flex-direction: column; }
        .docs-viewer.mini .dv-sidebar { width: 160px; }
        
        .dv-search { padding: 10px; position: relative; border-bottom: 1px solid var(--bd); }
        .dv-search svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--t3); }
        .dv-search input { width: 100%; height: 32px; background: var(--s2); border: 1px solid var(--bd); border-radius: 6px; padding-left: 28px; font-size: 12px; color: var(--t1); }
        
        .dv-search-results {
          position: absolute; top: 100%; left: 10px; right: 10px;
          background: var(--s2); border: 1px solid var(--ac); border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 100;
          max-height: 300px; overflow-y: auto;
        }
        .dv-search-item {
          display: flex; flex-direction: column; gap: 4px; padding: 10px;
          font-size: 12px; color: var(--t2); cursor: pointer; border-bottom: 1px solid var(--bd);
        }
        .dv-search-item-main { display: flex; align-items: center; gap: 10px; }
        .dv-search-item-meta { font-size: 10px; color: var(--t3); padding-left: 22px; }
        .dv-search-item:hover { background: var(--s3); color: var(--ac); }
        .dv-search-item:hover .dv-search-item-meta { color: var(--ac); opacity: 0.7; }
        .dv-search-item:last-child { border-bottom: none; }
        .dv-search-none { padding: 15px; text-align: center; font-size: 11px; color: var(--t3); }

        .dv-scroll { flex: 1; overflow-y: auto; padding: 8px 0; }
        .dv-cat { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--t3); cursor: pointer; font-weight: 700; }
        .dv-item { padding: 6px 12px; padding-left: 20px; font-size: 12.5px; color: var(--t2); cursor: pointer; }
        .dv-item:hover { background: var(--s2); color: var(--t1); }
        .dv-item.active { background: var(--ac); color: #000; font-weight: 600; }

        .dv-content { flex: 1; overflow-y: auto; position: relative; }
        .dv-loader { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--ac); animation: spin 1.5s linear infinite; }
        .dv-md-wrap { max-width: 800px; margin: 0 auto; padding: 30px; }
        .docs-viewer.mini .dv-md-wrap { padding: 15px; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* MD Styles */
        .md-content h1 { font-size: 2rem; margin-bottom: 1rem; color: var(--t1); }
        .md-content h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: var(--t1); border-bottom: 1px solid var(--bd); }
        .md-content p { line-height: 1.6; color: var(--t2); margin-bottom: 1rem; }
        .code-block { background: #000; border: 1px solid var(--bd); border-radius: 6px; margin: 15px 0; overflow: hidden; }
        .code-lang { background: var(--s2); padding: 4px 10px; font-size: 10px; color: var(--t3); border-bottom: 1px solid var(--bd); }
        .code-block pre { padding: 15px; margin: 0; overflow-x: auto; font-size: 12px; color: #a5d6ff; }
        
        /* Hub Styles */
        .hub-wrap { padding: 0 0 60px 0; }
        .hub-hero { 
          padding: 80px 40px; background: #070707; border-bottom: 1px solid var(--bd); 
          position: relative; overflow: hidden; margin-bottom: 40px;
        }
        .hero-glow {
          position: absolute; top: -50%; left: 10%; width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }
        .hero-eyebrow { color: var(--ac); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
        .hero-title { font-size: 3.5rem; font-weight: 850; color: #fff; margin-bottom: 16px; letter-spacing: -2px; }
        .hero-sub { font-size: 1.1rem; color: var(--t3); line-height: 1.6; margin-bottom: 30px; }
        .hero-sub strong { color: var(--t1); }
        
        .stats-row { display: flex; gap: 30px; margin-bottom: 40px; }
        .stat-card { display: flex; flex-direction: column; }
        .stat-val { font-size: 24px; font-weight: 800; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; color: var(--t3); font-weight: 600; }

        .hero-search {
          display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03);
          border: 1px solid var(--bd); border-radius: 12px; padding: 0 20px; height: 54px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .hero-search input { 
          flex: 1; background: transparent; border: none; color: #fff; font-size: 16px; 
          font-family: inherit; font-weight: 400;
        }
        .hero-search input:focus { outline: none; }

        .hub-layout { display: flex; padding: 0 40px; gap: 40px; max-width: 1300px; margin: 0 auto; }
        .hub-sidebar { width: 220px; flex-shrink: 0; }
        .hub-sidebar h3 { font-size: 12px; text-transform: uppercase; color: var(--t3); margin-bottom: 20px; letter-spacing: 1px; }
        .hub-cat-list { display: flex; flex-direction: column; gap: 4px; }
        .hub-cat-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; border-radius: 8px; font-size: 13.5px; color: var(--t2);
          background: transparent; border: none; cursor: pointer; text-align: left;
        }
        .hub-cat-item:hover { background: var(--s2); color: var(--t1); }
        .hub-cat-item.active { background: var(--ac); color: #000; font-weight: 600; }
        .hub-cat-item span { font-size: 11px; opacity: 0.6; }

        .hub-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        
        .skill-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          overflow: hidden; transition: 0.2s; cursor: pointer; display: flex; flex-direction: column;
        }
        .skill-card:hover { border-color: var(--t3); transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .skill-accent { height: 3px; width: 100%; }
        .skill-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
        .skill-top { display: flex; gap: 12px; margin-bottom: 12px; }
        .skill-icon { font-size: 24px; padding-top: 4px; }
        .skill-title-grp h4 { margin: 0; font-size: 15px; font-weight: 700; color: var(--t1); }
        .source-badge { font-size: 9px; text-transform: uppercase; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid; margin-top: 4px; display: inline-block; }
        .skill-desc { font-size: 13.5px; color: var(--t3); line-height: 1.5; margin-bottom: 16px; flex: 1; }
        .skill-meta { display: flex; flex-wrap: wrap; gap: 6px; }
        .cat-tag { font-size: 10px; padding: 3px 8px; background: var(--s2); color: var(--t2); border-radius: 4px; }
        .plat-tag { font-size: 10px; color: var(--t3); }

        /* Story Hub Styles */
        .story-filters { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 40px; margin-bottom: 30px; justify-content: center; }
        .filter-btn { 
          padding: 6px 16px; border-radius: 20px; background: var(--s1); 
          border: 1px solid var(--bd); color: var(--t2); font-size: 13px; cursor: pointer;
        }
        .filter-btn.active { background: var(--ac); color: #000; border-color: var(--ac); font-weight: 600; }
        
        .collage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; padding: 0 40px; }
        .story-tile {
          background: #111; border: 1px solid var(--bd); border-radius: 16px; padding: 24px;
          text-decoration: none; color: inherit; transition: 0.3s;
          display: flex; flex-direction: column; gap: 12px;
        }
        .story-tile:hover { transform: scale(1.02); border-color: var(--ac); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .story-badge-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .story-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .story-src { font-size: 10px; color: var(--t3); background: var(--s2); padding: 2px 8px; border-radius: 10px; }
        .story-tile h3 { font-size: 18px; line-height: 1.3; font-weight: 700; color: var(--t1); margin: 0; }
        .story-tile p { font-size: 14.5px; color: var(--t3); line-height: 1.6; margin: 0; font-style: italic; }
        .story-footer { font-size: 12px; color: var(--t2); margin-top: auto; border-top: 1px solid var(--bd); padding-top: 12px; }

        /* Mini Overrides */
        .docs-viewer.mini .hub-hero { padding: 40px 20px; margin-bottom: 20px; }
        .docs-viewer.mini .hero-title { font-size: 1.5rem; margin-bottom: 10px; }
        .docs-viewer.mini .hero-search { height: 40px; border-radius: 8px; }
        .docs-viewer.mini .hub-layout { padding: 0 20px; gap: 20px; }
        .docs-viewer.mini .hub-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
        .docs-viewer.mini .skill-body { padding: 12px; }
        .docs-viewer.mini .skill-top { gap: 8px; }
        .docs-viewer.mini .skill-icon { font-size: 20px; }
        .docs-viewer.mini .skill-title-grp h4 { font-size: 13px; }
        .docs-viewer.mini .collage-grid { grid-template-columns: 1fr; padding: 0 20px; gap: 10px; }
        .docs-viewer.mini .story-tile { padding: 12px; border-radius: 8px; }
        .docs-viewer.mini .story-tile h3 { font-size: 14px; }
      `}</style>
    </div>
  );
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

String.prototype.titleCase = function() {
  return this.split(' ').map(w => w[0] ? w[0].toUpperCase() + w.substring(1).toLowerCase() : '').join(' ');
};

