type IconProps = {
  className?: string;
};

function BrandMark({
  className,
  lightSrc,
  darkSrc,
  markClass,
}: {
  className: string;
  lightSrc: string;
  darkSrc: string;
  markClass: string;
}) {
  return (
    <span className={`brand-icon ${markClass} ${className}`.trim()} aria-hidden="true">
      <img
        className="brand-icon-light"
        src={lightSrc}
        alt=""
        width={24}
        height={24}
        decoding="async"
        draggable={false}
      />
      <img
        className="brand-icon-dark"
        src={darkSrc}
        alt=""
        width={24}
        height={24}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

/** Brand spark (✳) — cream+gold swap in dark mode. */
export function BrandSpark({ className = '' }: IconProps) {
  return (
    <BrandMark
      className={className}
      markClass="brand-spark"
      lightSrc="/brand/cd-sparkle.png"
      darkSrc="/brand/cd-sparkle-dark.png"
    />
  );
}

/** Brand arrow (↗) — cream+gold swap in dark mode (readable on teal CTAs). */
export function BrandArrow({ className = '' }: IconProps) {
  return (
    <BrandMark
      className={className}
      markClass="brand-arrow"
      lightSrc="/brand/cd-arrow.png"
      darkSrc="/brand/cd-arrow-dark.png"
    />
  );
}

/** Downward arrow — same mark, rotated. */
export function BrandArrowDown({ className = '' }: IconProps) {
  return <BrandArrow className={`brand-arrow--down ${className}`.trim()} />;
}
