type IconProps = {
  className?: string;
  /** cream = on teal buttons; teal = on yellow/orange or light surfaces; auto = light↔dark swap */
  tone?: 'cream' | 'teal' | 'auto';
};

const ARROW = {
  cream: '/brand/cd-arrow-cream.svg',
  teal: '/brand/cd-arrow-teal.svg',
} as const;

const SPARK = {
  cream: '/brand/cd-sparkle-cream.svg',
  teal: '/brand/cd-sparkle-teal.svg',
} as const;

function CdIcon({
  src,
  className = '',
  markClass = '',
}: {
  src: string;
  className?: string;
  markClass?: string;
}) {
  return (
    <img
      className={`cd-icon ${markClass} ${className}`.trim()}
      src={src}
      alt=""
      width={24}
      height={24}
      decoding="async"
      aria-hidden="true"
      draggable={false}
    />
  );
}

function AutoIcon({
  lightSrc,
  darkSrc,
  className = '',
  markClass = '',
}: {
  lightSrc: string;
  darkSrc: string;
  className?: string;
  markClass?: string;
}) {
  return (
    <span className={`cd-icon-auto ${markClass} ${className}`.trim()} aria-hidden="true">
      <img
        className="cd-icon cd-icon--for-light"
        src={lightSrc}
        alt=""
        width={24}
        height={24}
        decoding="async"
        draggable={false}
      />
      <img
        className="cd-icon cd-icon--for-dark"
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

/** Solid spark — teal on gold strip; cream on dark backgrounds. */
export function BrandSpark({ className = '', tone = 'teal' }: IconProps) {
  if (tone === 'auto') {
    return (
      <AutoIcon
        className={className}
        markClass="brand-spark"
        lightSrc={SPARK.teal}
        darkSrc={SPARK.cream}
      />
    );
  }
  return (
    <CdIcon
      className={className}
      markClass="brand-spark"
      src={tone === 'cream' ? SPARK.cream : SPARK.teal}
    />
  );
}

/** Solid arrow — cream on teal CTAs; teal on yellow/orange; auto for text links. */
export function BrandArrow({ className = '', tone = 'cream' }: IconProps) {
  if (tone === 'auto') {
    return (
      <AutoIcon
        className={className}
        markClass="brand-arrow"
        lightSrc={ARROW.teal}
        darkSrc={ARROW.cream}
      />
    );
  }
  return (
    <CdIcon
      className={className}
      markClass="brand-arrow"
      src={tone === 'cream' ? ARROW.cream : ARROW.teal}
    />
  );
}

/** Downward arrow — same mark, rotated. */
export function BrandArrowDown({ className = '', tone = 'auto' }: IconProps) {
  return (
    <BrandArrow className={`brand-arrow--down ${className}`.trim()} tone={tone} />
  );
}
