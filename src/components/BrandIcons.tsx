type IconProps = {
  className?: string;
};

/**
 * Brand spark (✳ replacement) and arrow (↗ / ↓ replacement).
 * Uses the provided brand PNGs; dark mode lightens the teal via CSS.
 */
export function BrandSpark({ className = '' }: IconProps) {
  return (
    <img
      className={`brand-icon brand-spark ${className}`.trim()}
      src="/brand/cd-sparkle.png"
      alt=""
      width={24}
      height={24}
      decoding="async"
      aria-hidden="true"
      draggable={false}
    />
  );
}

export function BrandArrow({ className = '' }: IconProps) {
  return (
    <img
      className={`brand-icon brand-arrow ${className}`.trim()}
      src="/brand/cd-arrow.png"
      alt=""
      width={24}
      height={24}
      decoding="async"
      aria-hidden="true"
      draggable={false}
    />
  );
}

export function BrandArrowDown({ className = '' }: IconProps) {
  return <BrandArrow className={`brand-arrow--down ${className}`.trim()} />;
}
