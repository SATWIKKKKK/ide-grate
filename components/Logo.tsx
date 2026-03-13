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
    <span className="inline-flex items-center gap-2 font-mono font-bold tracking-tight select-none">
      <span
        className={`${s.bracket} text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.7)]`}
        aria-hidden="true"
      >
        {'</>'}
      </span>
      <span className={s.text}>
        <span className="text-gray-100">vs-</span>
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          integrate
        </span>
      </span>
    </span>
  );
}
