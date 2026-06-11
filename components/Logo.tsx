type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoTone = 'default' | 'inverted';

const sizes: Record<LogoSize, { bracket: string; text: string }> = {
  sm: { bracket: 'text-xl',  text: 'text-xl'  },
  md: { bracket: 'text-2xl', text: 'text-2xl' },
  lg: { bracket: 'text-4xl', text: 'text-4xl' },
  xl: { bracket: 'text-5xl', text: 'text-5xl' },
};

export default function Logo({ size = 'sm', tone = 'default' }: { size?: LogoSize; tone?: LogoTone }) {
  const s = sizes[size];
  const textColor = tone === 'inverted' ? 'text-[var(--color-paper)]' : 'text-[var(--color-ink)]';
  const dashColor = tone === 'inverted' ? 'text-[var(--color-paper-3)]' : 'text-[var(--color-muted)]';
  return (
    <span className="inline-flex items-center gap-2 font-mono font-semibold tracking-normal select-none">
      <span
        className={`${s.bracket} text-[var(--color-accent)]`}
        aria-hidden="true"
      >
        {'//'}
      </span>
      <span className={`${s.text} ${textColor}`}>
        <span>vs</span>
        <span className={dashColor}>-</span>
        <span>integrate</span>
      </span>
    </span>
  );
}
