'use client';

export function TitleBar() {
  const handleMinimize = async () => {
    if (typeof window !== 'undefined') {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (typeof window !== 'undefined') {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().toggleMaximize();
    }
  };

  const handleClose = async () => {
    if (typeof window !== 'undefined') {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().close();
    }
  };

  return (
    <div
      className="h-[30px] w-full bg-[#121315] dark:bg-[#0a0a0a] text-[#9ef01a] flex items-center justify-between px-3 select-none border-b border-transparent dark:border-white/5"
      onPointerDown={async (e) => {
        if (e.buttons === 1) {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          getCurrentWindow().startDragging();
        }
      }}
    >
      <div className="flex items-center gap-2 pointer-events-none">
          <img src="/icon.png" alt="Icon" className="w-4 h-4 object-contain" />
      </div>

      <div
        className="flex items-center gap-1 text-gray-400"
      >
        <button
          onClick={handleMinimize}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-200"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-200"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-[#e81123] transition-all duration-200 cursor-pointer text-gray-500 hover:text-white"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
