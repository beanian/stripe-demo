export default function AppHeader() {
  return (
    <header className="bg-axa-blue w-full h-14 flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center gap-2.5">
        <span className="text-white text-xl font-extrabold tracking-wider">AXA</span>
        <span className="text-white/60 text-xs font-medium tracking-wide">Motor Insurance</span>
      </div>
      <span className="bg-yellow-400 text-yellow-900 font-bold text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
        Test Mode
      </span>
    </header>
  );
}
