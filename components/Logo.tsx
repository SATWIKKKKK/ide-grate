type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<LogoSize, { bracket: string; text: string }> = {
  sm: { bracket: 'text-xl',  text: 'text-xl'  },
  md: { bracket: 'text-2xl', text: 'text-2xl' },
  lg: { bracket: 'text-4xl', text: 'text-4xl' },
  xl: { bracket: 'text-5xl', text: 'text-5xl' },
};

export default function Logo({ size = 'sm' }: { size?: LogoSize }) {
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-2 font-mono font-medium tracking-normal select-none">
      <span
        className={`${s.bracket} text-[var(--color-brand-blue)] drop-shadow-[0_0_22px_oklch(62%_0.22_255_/_0.34)]`}
        aria-hidden="true"
      >
        {'</>'}
      </span>
      <span className={s.text}>
        <span className="text-[var(--color-brand-faint)]">vs-</span>
        <span className="bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-cyan)] bg-clip-text text-transparent">
          integrate
        </span>
      </span>
    </span>
  );
}
