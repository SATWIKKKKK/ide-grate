type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoTone = 'default' | 'inverted';

const sizes: Record<LogoSize, { mark: string; text: string }> = {
  sm: { mark: 'size-1.5', text: 'text-base' },
  md: { mark: 'size-2', text: 'text-xl' },
  lg: { mark: 'size-2.5', text: 'text-2xl' },
  xl: { mark: 'size-3', text: 'text-3xl' },
};

export default function Logo({ size = 'sm', tone = 'default' }: { size?: LogoSize; tone?: LogoTone }) {
  const s = sizes[size];
  const textColor = tone === 'inverted' ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-primary)]';
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className={`${s.mark} rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-surface-container)]`}
        aria-hidden="true"
      />
      <span className={`${s.text} ${textColor} font-display font-bold leading-none tracking-normal`}>
        Cadence
      </span>
    </span>
  );
}
