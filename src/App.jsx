import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, FileCode, Search, Menu, X, 
  Code2, BookOpen, ChevronRight, ChevronDown, Palette
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, ghcolors, dracula, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rawData from './docData.json';
import remarkGfm from 'remark-gfm';

// --- CONFIGURATION ---

const THEMES = [
  { id: 'light', name: 'Light', isDark: false },
  { id: 'github', name: 'GitHub Dark', isDark: true },
  { id: 'vscode', name: 'VS Code', isDark: true },
  { id: 'dracula', name: 'Dracula', isDark: true },
  { id: 'solarized', name: 'Solarized', isDark: false },
];

const ACCENTS = [
  { id: 'blue', name: 'Blue', color: '#2563eb', dim: 'rgba(37, 99, 235, 0.15)' },
  { id: 'purple', name: 'Purple', color: '#9333ea', dim: 'rgba(147, 51, 234, 0.15)' },
  { id: 'emerald', name: 'Emerald', color: '#059669', dim: 'rgba(5, 150, 105, 0.15)' },
  { id: 'orange', name: 'Orange', color: '#ea580c', dim: 'rgba(234, 88, 12, 0.15)' },
  { id: 'rose', name: 'Rose', color: '#e11d48', dim: 'rgba(225, 29, 72, 0.15)' },
];

// --- HELPER COMPONENTS ---

const FileTree = ({ data, onSelect, selectedPath }) => {
  const sortedFolders = [...data].sort((a, b) => a.folder.length - b.folder.length);
  return (
    <div className="flex flex-col gap-0.5 p-2">
      {sortedFolders.map((folderGroup) => (
        <FolderGroup 
          key={folderGroup.folder} 
          folder={folderGroup} 
          onSelect={onSelect} 
          selectedPath={selectedPath} 
        />
      ))}
    </div>
  );
};

const FolderGroup = ({ folder, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(true);
  const displayName = folder.folder === "." ? "Root" : folder.folder;
  if (folder.files.length === 0) return null;

  return (
    <div className="pl-2">
      <div 
        className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-accent py-1 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Folder size={14} />
        <span className="font-bold text-xs uppercase tracking-wide">{displayName}</span>
      </div>

      {isOpen && (
        <div className="pl-3 ml-2 border-l border-border-main mt-1 flex flex-col gap-0.5">
          {folder.files.map((file) => (
            <div 
              key={file.path}
              onClick={() => onSelect(file)}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors truncate
                ${selectedPath === file.path 
                  ? 'bg-accent-dim text-accent font-medium' 
                  : 'text-text-primary hover:bg-bg-main'}
              `}
              title={file.name}
            >
              <FileCode size={14} className="shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('explanation'); 
  const [currentTheme, setCurrentTheme] = useState('github');
  const [currentAccent, setCurrentAccent] = useState('emerald');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply Theme & Accent
  useEffect(() => {
    // 1. Set Background Theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeObj = THEMES.find(t => t.id === currentTheme);
    if (themeObj?.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Set Accent Colors (CSS Variables)
    const accentObj = ACCENTS.find(a => a.id === currentAccent);
    if (accentObj) {
      document.documentElement.style.setProperty('--accent', accentObj.color);
      document.documentElement.style.setProperty('--accent-dim', accentObj.dim);
    }

  }, [currentTheme, currentAccent]);

  // Sidebar Resizing
  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  const resize = (e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) setSidebarWidth(newWidth);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm) return rawData;
    const lowerTerm = searchTerm.toLowerCase();
    return rawData.map(group => ({
      ...group,
      files: group.files.filter(f => f.name.toLowerCase().includes(lowerTerm))
    })).filter(group => group.files.length > 0);
  }, [searchTerm]);

  const activeThemeObj = THEMES.find(t => t.id === currentTheme);
  const activeAccentObj = ACCENTS.find(a => a.id === currentAccent);

  // Helper to pick syntax highlight style
  const getSyntaxStyle = () => {
    if (currentTheme === 'dracula') return dracula;
    if (currentTheme === 'solarized') return solarizedlight;
    return activeThemeObj.isDark ? vscDarkPlus : ghcolors;
  };

  return (
    <div className="flex flex-col h-screen bg-bg-main text-text-primary font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <header className="h-14 border-b border-border-main flex items-center justify-between px-4 bg-bg-header shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-text-secondary">
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2 font-bold text-lg text-accent">
            <BookOpen size={20} />
            <span className="hidden sm:inline">Fishnet CodeDocs</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-lg mx-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border border-border-main bg-bg-main text-sm focus:outline-none focus:border-accent placeholder-text-secondary"
          />
        </div>

        <div className="flex items-center gap-2">
          
          {/* Accent Switcher */}
          <div className="relative group z-50">
            <button className="p-2 rounded-md hover:bg-bg-main text-text-secondary transition flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: activeAccentObj.color }} />
              <ChevronDown size={14} className="opacity-50" />
            </button>
            <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block">
              <div className="bg-bg-header border border-border-main rounded-md shadow-xl overflow-hidden p-1">
                {ACCENTS.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setCurrentAccent(acc.id)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-bg-main flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: acc.color }} />
                    <span className={currentAccent === acc.id ? 'font-bold text-text-primary' : 'text-text-secondary'}>
                      {acc.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="relative group z-50">
            <button className="p-2 rounded-md hover:bg-bg-main text-text-secondary transition flex items-center gap-2">
              <Palette size={18} />
              <span className="text-xs font-medium hidden sm:inline">{activeThemeObj.name}</span>
            </button>
            <div className="absolute right-0 top-full pt-2 w-36 hidden group-hover:block">
              <div className="bg-bg-header border border-border-main rounded-md shadow-xl overflow-hidden">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setCurrentTheme(theme.id)}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${currentTheme === theme.id 
                        ? 'text-accent font-bold bg-accent-dim' 
                        : 'text-text-primary hover:bg-bg-main hover:text-accent'}
                    `}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar */}
        <aside 
          className={`
            fixed md:relative z-10 h-full bg-bg-sidebar border-r border-border-main overflow-y-auto custom-scrollbar transition-transform duration-300 md:translate-x-0
            ${mobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:w-auto'}
          `}
          style={{ width: window.innerWidth >= 768 ? sidebarWidth : undefined }}
        >
          <div className="md:hidden flex justify-end p-2">
            <button onClick={() => setMobileMenuOpen(false)}><X size={20} className="text-text-secondary" /></button>
          </div>
          <div className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Explorer
          </div>
          <FileTree 
            data={filteredData} 
            onSelect={(file) => {
              setSelectedFile(file);
              setViewMode('explanation');
              setMobileMenuOpen(false); 
            }}
            selectedPath={selectedFile?.path} 
          />
        </aside>

        {/* Drag Handle */}
        <div 
          className="hidden md:block w-1 cursor-col-resize hover:bg-accent transition-colors z-20"
          onMouseDown={startResizing}
        />

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-0 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-main relative">
          
          {selectedFile ? (
            <>
              <div className="h-12 border-b border-border-main flex items-center justify-between px-4 sm:px-6 bg-bg-main sticky top-0 z-10 shrink-0">
                <h2 className="font-mono text-sm sm:text-base font-semibold truncate text-text-primary max-w-[50%]">
                  {selectedFile.name}
                </h2>
                
                <div className="flex bg-bg-header rounded-lg p-0.5 border border-border-main">
                  <button 
                    onClick={() => setViewMode('explanation')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs sm:text-sm font-medium transition-all ${
                      viewMode === 'explanation' 
                        ? 'bg-bg-main shadow-sm text-accent' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <BookOpen size={14} /> <span className="hidden sm:inline">Explanation</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('code')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs sm:text-sm font-medium transition-all ${
                      viewMode === 'code' 
                        ? 'bg-bg-main shadow-sm text-accent' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Code2 size={14} /> <span className="hidden sm:inline">Code</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  {viewMode === 'explanation' ? (
                    <article className="prose dark:prose-invert prose-neutral max-w-none prose-pre:bg-bg-sidebar prose-pre:border prose-pre:border-border-main prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-a:text-accent">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <div className="not-prose rounded-md overflow-hidden my-4 border border-border-main shadow-sm">
                                <SyntaxHighlighter
                                  style={getSyntaxStyle()}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '1rem', fontSize: '0.85rem' }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className={`${className} bg-accent-dim px-1.5 py-0.5 rounded text-sm text-accent font-mono border border-transparent`} {...props}>
                                {children}
                              </code>
                            )
                          },
                          // --- CUSTOM TABLE COMPONENTS ---
                          table({children}) {
                            return (
                              <div className="overflow-x-auto my-6 border border-border-main rounded-lg shadow-sm">
                                <table className="min-w-full divide-y divide-border-main text-sm">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          thead({children}) {
                            return <thead className="bg-bg-sidebar text-text-primary font-semibold">{children}</thead>;
                          },
                          tbody({children}) {
                            return <tbody className="divide-y divide-border-main bg-bg-main">{children}</tbody>;
                          },
                          tr({children}) {
                            return <tr className="hover:bg-bg-sidebar/50 transition-colors">{children}</tr>;
                          },
                          th({children}) {
                            return <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">{children}</th>;
                          },
                          td({children}) {
                            return <td className="px-4 py-3 whitespace-nowrap text-text-primary">{children}</td>;
                          }
                        }}
                      >
                        {selectedFile.explanation}
                      </ReactMarkdown>
                    </article>
                  ) : (
                    <div className="rounded-lg overflow-hidden border border-border-main shadow-sm">
                      <SyntaxHighlighter 
                        language="csharp" 
                        style={getSyntaxStyle()}
                        showLineNumbers={true}
                        customStyle={{ margin: 0, fontSize: '13px', lineHeight: '1.5', background: 'var(--bg-sidebar)' }}
                      >
                        {selectedFile.code}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <BookOpen size={64} className="mb-4 opacity-10" />
              <p className="text-sm uppercase tracking-widest opacity-50">Select a file</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;