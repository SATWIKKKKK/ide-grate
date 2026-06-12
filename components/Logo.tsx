type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoTone = 'default' | 'inverted';

const sizes: Record<LogoSize, { bracket: string; text: string }> = {
  sm: { bracket: 'text-sm',  text: 'text-xl'  },
  md: { bracket: 'text-base', text: 'text-2xl' },
  lg: { bracket: 'text-xl', text: 'text-4xl' },
  xl: { bracket: 'text-2xl', text: 'text-5xl' },
};

export default function Logo({ size = 'sm', tone = 'default' }: { size?: LogoSize; tone?: LogoTone }) {
  const s = sizes[size];
  const textColor = tone === 'inverted' ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-primary)]';
  const dashColor = tone === 'inverted' ? 'text-[var(--color-rule)]' : 'text-[var(--color-muted)]';
  return (
    <span className="inline-flex items-baseline gap-2 select-none">
      <span
        className={`${s.bracket} font-mono text-[var(--color-muted)]`}
        aria-hidden="true"
      >
        {'//'}
      </span>
      <span className={`${s.text} ${textColor} font-display font-bold leading-none tracking-normal`}>
        <span>vs</span>
        <span className={dashColor}>-</span>
        <span>integrate</span>
      </span>
    </span>
  );
}
