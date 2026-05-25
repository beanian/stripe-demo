import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Network, X, ArrowRight, Webhook, Cloud, Globe, Workflow } from 'lucide-react';
import { INTEGRATION_SPECS, findSpec, type IntegrationSpec } from './integration-specs';

interface SpotlightCtx {
  active: boolean;
  toggle: () => void;
  selectedId: string | null;
  select: (id: string | null) => void;
}

const Ctx = createContext<SpotlightCtx | null>(null);

export function useSpotlight(): SpotlightCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('IntegrationSpotlight components must be inside <IntegrationSpotlightProvider>');
  return v;
}

export function IntegrationSpotlightProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = useCallback(() => {
    setActive((a) => {
      if (a) setSelectedId(null);
      return !a;
    });
  }, []);

  const select = useCallback((id: string | null) => setSelectedId(id), []);

  const value = useMemo(() => ({ active, toggle, selectedId, select }), [active, toggle, selectedId, select]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <SpotlightToggle />
      <SpotlightDrawer />
    </Ctx.Provider>
  );
}

/* ─────────────────────────────────────────────────────
   ANCHOR — wraps a UI region with a numbered pin badge
   ───────────────────────────────────────────────────── */

interface AnchorProps {
  specId: string;
  children: ReactNode;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const POSITION_CLASS: Record<NonNullable<AnchorProps['position']>, string> = {
  'top-right': '-top-3 -right-3',
  'top-left': '-top-3 -left-3',
  'bottom-right': '-bottom-3 -right-3',
  'bottom-left': '-bottom-3 -left-3',
};

export function IntegrationAnchor({ specId, children, className = '', position = 'top-right' }: AnchorProps) {
  const { active, select, selectedId } = useSpotlight();
  const spec = findSpec(specId);

  if (!spec) return <>{children}</>;

  const isSelected = selectedId === specId;

  return (
    <div className={`relative ${active ? 'spotlight-anchor-active' : ''} ${className}`}>
      {children}
      {active && (
        <button
          type="button"
          onClick={() => select(isSelected ? null : specId)}
          className={`absolute ${POSITION_CLASS[position]} z-30 group`}
          aria-label={`Show integration #${spec.number}: ${spec.title}`}
        >
          <span
            className={`
              relative flex items-center justify-center
              w-8 h-8 rounded-full font-bold text-xs
              transition-all duration-300
              ${isSelected
                ? 'bg-axa-blue text-white shadow-lg shadow-axa-blue/40 scale-110'
                : 'bg-white text-axa-blue border-2 border-axa-blue shadow-lg hover:scale-110'}
            `}
          >
            {spec.number}
            <span className="absolute inset-0 rounded-full bg-axa-blue/40 animate-spotlight-ping pointer-events-none" />
          </span>
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FLOATING TOGGLE
   ───────────────────────────────────────────────────── */

function SpotlightToggle() {
  const { active, toggle } = useSpotlight();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`
        fixed bottom-6 right-6 z-40 flex items-center gap-2.5
        px-4 py-3 rounded-full font-semibold text-sm
        shadow-2xl transition-all duration-300
        ${active
          ? 'bg-axa-dark text-white hover:bg-axa-dark/90'
          : 'bg-white text-axa-blue border-2 border-axa-blue hover:bg-axa-blue hover:text-white'}
      `}
      aria-pressed={active}
    >
      <Network size={16} />
      {active ? 'Hide integrations' : 'Show MuleSoft integrations'}
      {!active && (
        <span className="ml-1 px-2 py-0.5 rounded-full bg-axa-blue/10 text-[10px] font-bold tracking-widest text-axa-blue">
          {INTEGRATION_SPECS.length}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   DRAWER — full spec for the selected integration
   ───────────────────────────────────────────────────── */

const DIRECTION_BADGE: Record<IntegrationSpec['direction'], { label: string; icon: typeof Cloud; cls: string }> = {
  outbound: { label: 'MuleSoft → Stripe', icon: Cloud, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'inbound-webhook': { label: 'Stripe → MuleSoft', icon: Webhook, cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  'browser-direct': { label: 'Browser → Stripe', icon: Globe, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function SpotlightDrawer() {
  const { active, selectedId, select } = useSpotlight();
  const spec = selectedId ? findSpec(selectedId) : null;
  const open = active && !!spec;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-axa-dark/30 backdrop-blur-[2px] animate-fade-in"
          onClick={() => select(null)}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-white shadow-2xl
          transform transition-transform duration-300 overflow-y-auto
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-hidden={!open}
      >
        {spec && <DrawerBody spec={spec} onClose={() => select(null)} />}
      </aside>
    </>
  );
}

function DrawerBody({ spec, onClose }: { spec: IntegrationSpec; onClose: () => void }) {
  const dir = DIRECTION_BADGE[spec.direction];
  const DirIcon = dir.icon;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-axa-grey-200 px-6 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-axa-blue text-white font-bold text-sm flex items-center justify-center">
            {spec.number}
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-axa-grey-400 uppercase">Integration</p>
            <h2 className="text-lg font-bold text-axa-dark leading-tight">{spec.title}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-axa-grey-400 hover:bg-axa-grey-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-6 flex-1">
        {/* Direction + endpoint */}
        <div className="space-y-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${dir.cls}`}>
            <DirIcon size={11} />
            {dir.label}
          </span>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2 py-1 rounded bg-axa-dark text-white font-bold">{spec.endpoint.method}</span>
            <span className="text-axa-grey-700 break-all">{spec.endpoint.path}</span>
          </div>

          <p className="text-sm text-axa-grey-700 leading-relaxed">{spec.blurb}</p>
        </div>

        {/* Trigger */}
        <Section label="Trigger">
          <p className="text-sm text-axa-grey-700">{spec.trigger}</p>
        </Section>

        {/* MuleSoft role */}
        <Section label="MuleSoft responsibility" icon={Workflow}>
          <p className="text-sm text-axa-grey-700 leading-relaxed">{spec.muleSoftRole}</p>
        </Section>

        {/* Webhook events */}
        {spec.webhookEvents && (
          <Section label="Webhook events to subscribe">
            <ul className="space-y-1.5">
              {spec.webhookEvents.map((evt) => (
                <li key={evt} className="flex items-center gap-2">
                  <ArrowRight size={12} className="text-axa-grey-400 flex-shrink-0" />
                  <code className="text-xs font-mono text-axa-dark bg-axa-grey-100 px-1.5 py-0.5 rounded">{evt}</code>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Request sample */}
        {spec.requestSample && (
          <Section label={spec.direction === 'inbound-webhook' ? 'Sample webhook payload' : 'Sample request body'}>
            <CodeBlock>{spec.requestSample}</CodeBlock>
          </Section>
        )}

        {/* Response sample */}
        {spec.responseSample && (
          <Section label="Sample response (relevant fields)">
            <CodeBlock>{spec.responseSample}</CodeBlock>
          </Section>
        )}

        {/* AXA systems */}
        <Section label="AXA systems touched">
          <div className="flex flex-wrap gap-1.5">
            {spec.axaSystems.map((s) => (
              <span key={s} className="px-2 py-1 rounded-md bg-axa-blue/10 text-axa-blue text-[11px] font-semibold">
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* Notes */}
        {spec.notes && (
          <div className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">Note</p>
            <p className="text-sm text-amber-900 leading-relaxed">{spec.notes}</p>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <DrawerNav currentId={spec.id} />
    </div>
  );
}

function Section({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Cloud;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-axa-grey-400 uppercase mb-2">
        {Icon && <Icon size={11} />}
        {label}
      </p>
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="text-[11px] leading-relaxed bg-axa-dark text-axa-grey-100 rounded-lg p-3 overflow-x-auto font-mono">
      {children}
    </pre>
  );
}

function DrawerNav({ currentId }: { currentId: string }) {
  const { select } = useSpotlight();
  const idx = INTEGRATION_SPECS.findIndex((s) => s.id === currentId);
  const prev = idx > 0 ? INTEGRATION_SPECS[idx - 1] : null;
  const next = idx < INTEGRATION_SPECS.length - 1 ? INTEGRATION_SPECS[idx + 1] : null;

  return (
    <div className="sticky bottom-0 bg-white border-t border-axa-grey-200 px-6 py-3 flex items-center justify-between gap-2">
      <button
        onClick={() => prev && select(prev.id)}
        disabled={!prev}
        className="flex-1 text-left px-3 py-2 rounded-lg hover:bg-axa-grey-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <p className="text-[9px] font-bold tracking-widest text-axa-grey-400 uppercase">Prev</p>
        <p className="text-xs font-semibold text-axa-grey-700 truncate">
          {prev ? `${prev.number}. ${prev.title}` : '—'}
        </p>
      </button>
      <button
        onClick={() => next && select(next.id)}
        disabled={!next}
        className="flex-1 text-right px-3 py-2 rounded-lg hover:bg-axa-grey-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <p className="text-[9px] font-bold tracking-widest text-axa-grey-400 uppercase">Next</p>
        <p className="text-xs font-semibold text-axa-grey-700 truncate">
          {next ? `${next.number}. ${next.title}` : '—'}
        </p>
      </button>
    </div>
  );
}
