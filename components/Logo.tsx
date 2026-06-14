type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoTone = 'default' | 'inverted';

const sizes: Record<LogoSize, { text: string }> = {
  sm: { text: 'text-base' },
  md: { text: 'text-xl' },
  lg: { text: 'text-2xl' },
  xl: { text: 'text-3xl' },
};

export default function Logo({ size = 'sm', tone = 'default' }: { size?: LogoSize; tone?: LogoTone }) {
  const s = sizes[size];
  const textColor = tone === 'inverted' ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-primary)]';
  return (
    <span className="inline-flex items-center select-none">
      <span className={`${s.text} ${textColor} font-display font-bold leading-none tracking-normal`}>
        Cadence
      </span>
    </span>
  );
}
