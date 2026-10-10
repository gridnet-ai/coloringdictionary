type Props = {
  href?: string;
  onClick?: () => void;
  /**
   * Collection cards sit on paper that turns dark.
   * Inventory, carousel, and shop cards stay white, so they keep the dark wordmark.
   */
  onPaper?: boolean;
};

export function StoreMarks({ href, onClick, onPaper }: Props) {
  const className = [
    'store-logos',
    onPaper ? 'store-logos--on-paper' : '',
    href ? '' : 'store-logos--soon',
  ]
    .filter(Boolean)
    .join(' ');

  const logos = (
    <>
      <img
        className="store-logo store-logo--amazon store-logo--for-light"
        src="/brand/amazon-wordmark.png"
        alt=""
      />
      <img
        className="store-logo store-logo--amazon store-logo--for-dark"
        src="/brand/amazon-wordmark-on-dark.png"
        alt=""
      />
      <img className="store-logo store-logo--prime" src="/brand/prime.png" alt="" />
    </>
  );

  if (!href) {
    return (
      <span className={className} aria-label="Coming soon">
        {logos}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Available on Amazon and Prime"
      onClick={onClick}
    >
      {logos}
    </a>
  );
}
