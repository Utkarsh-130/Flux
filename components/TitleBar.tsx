'use client';

export function TitleBar() {
  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div
      className="h-[30px] w-full bg-[#121315] text-[#9ef01a] flex items-center justify-between px-3 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5 text-[#9ef01a]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" fill="currentColor" fillOpacity="0.15" />
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          <path d="M13 7L9 13h4v4l4-6h-4z" fill="currentColor" />
        </svg>
      </div>

      <div
        className="flex items-center gap-1 text-gray-400"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition-all duration-[800ms] cursor-pointer text-gray-400 hover:text-white"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition-all duration-[800ms] cursor-pointer text-gray-400 hover:text-white"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-[#e81123] transition-all duration-[800ms] cursor-pointer text-gray-400 hover:text-white"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
