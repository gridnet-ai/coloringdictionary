import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteChrome } from '@/components/SiteChrome';
import {
  AGE_GROUPS,
  ageGroupById,
  matchesAgeFilter,
  parseAgeGroupParam,
  type AgeGroupId,
} from '@/lib/ageGroups';
import {
  CATALOG,
  catalogAgeLabel,
  formatUsd,
  type CatalogProduct,
} from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { recordVcapHit } from '@/lib/vcapTracking';

function ProductCard({
  product,
  onAdded,
}: {
  product: CatalogProduct;
  onAdded: () => void;
}) {
  const { addItem } = useCart();
  const comingSoon = product.status === 'coming-soon';

  return (
    <article className="shop-card">
      <div className="shop-card-cover">
        {product.badge ? (
          <span className="shop-badge">{product.badge}</span>
        ) : null}
        <img
          src={product.cover}
          alt=""
          width={400}
          height={520}
          loading="lazy"
        />
      </div>
      <div className="shop-card-body">
        {product.seriesLabel ? (
          <p className="shop-series">{product.seriesLabel}</p>
        ) : null}
        <h2 className="shop-card-title">{product.title}</h2>
        <p className="shop-meta">
          {product.format} · {catalogAgeLabel(product)}
        </p>
        {product.blurb ? <p className="shop-blurb">{product.blurb}</p> : null}
        <p className="shop-price">
          {formatUsd(product.priceCents)}
          {product.listPriceCents ? (
            <span className="shop-list">
              {' '}
              <s>{formatUsd(product.listPriceCents)}</s>
            </span>
          ) : null}
        </p>
        <div className="shop-card-actions">
          <button
            type="button"
            className="shop-add"
            disabled={comingSoon}
            onClick={() => {
              addItem(product.slug);
              onAdded();
              recordVcapHit('cart_add', '/shop', { book: product.slug });
            }}
          >
            {comingSoon ? 'Coming soon' : 'Add to cart'}
          </button>
          <a
            className="shop-amazon"
            href={product.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              recordVcapHit('amazon_cta', '/shop', { book: product.slug })
            }
          >
            View on Amazon
          </a>
        </div>
      </div>
    </article>
  );
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ageFilter = parseAgeGroupParam(searchParams.get('age'));
  const ageGroup = ageGroupById(ageFilter);
  const { count, items, subtotalCents, setQuantity, removeItem, clear } =
    useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  const products = useMemo(
    () =>
      CATALOG.filter((p) =>
        matchesAgeFilter(p.readingAge, ageFilter, p.ageFilters),
      ),
    [ageFilter],
  );

  function setAge(id: AgeGroupId) {
    if (id === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ age: id });
    }
  }

  async function checkout() {
    if (items.length === 0) return;
    setCheckoutError('');
    setCheckingOut(true);
    recordVcapHit('checkout_start', '/shop', { lines: String(items.length) });
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            slug: i.product.slug,
            quantity: i.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout unavailable');
      }
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : 'Could not start checkout. Try again.',
      );
      setCheckingOut(false);
    }
  }

  return (
    <SiteChrome>
      <main id="main" className="shop-page">
        <div className="shop-top wrap">
          <div>
            <p className="eyebrow">SHOP</p>
            <h1>Coloring Dictionary catalogue</h1>
            <p className="shop-intro">
              Browse by age, add titles to your cart, and check out with Stripe —
              or open the matching Amazon listing.
            </p>
          </div>
          <button
            type="button"
            className="shop-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${count} items`}
          >
            Cart
            {count > 0 ? <span className="shop-cart-count">{count}</span> : null}
          </button>
        </div>

        <div className="shop-layout wrap">
          <aside className="shop-filters" aria-label="Age filters">
            <p className="shop-filters-label">Browse by age</p>
            <ul className="shop-filter-list">
              {AGE_GROUPS.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className={`shop-filter${ageFilter === g.id ? ' is-active' : ''}`}
                    aria-current={ageFilter === g.id ? 'true' : undefined}
                    onClick={() => setAge(g.id)}
                  >
                    <span className="shop-filter-range">{g.label}</span>
                    <span className="shop-filter-audience">{g.audience}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="shop-results" aria-live="polite">
            <div className="shop-results-head">
              <h2>
                {ageGroup.label}
                <span className="shop-results-count">
                  {' '}
                  · {products.length} title{products.length === 1 ? '' : 's'}
                </span>
              </h2>
              {ageFilter !== 'all' ? (
                <p className="shop-results-note">{ageGroup.audience}</p>
              ) : (
                <p className="shop-results-note">
                  General-audience titles appear here and under every age band.
                </p>
              )}
            </div>
            {products.length === 0 ? (
              <p className="shop-empty">
                No titles in this band yet.{' '}
                <button type="button" className="text-link" onClick={() => setAge('all')}>
                  Show all ages
                </button>
              </p>
            ) : (
              <div className="shop-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.slug}
                    product={p}
                    onAdded={() => setCartOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {cartOpen ? (
        <div className="cart-drawer-root">
          <button
            type="button"
            className="cart-backdrop"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          />
          <aside
            className="cart-drawer"
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="cart-drawer-head">
              <h2>Your cart</h2>
              <button
                type="button"
                className="menu-close"
                aria-label="Close cart"
                onClick={() => setCartOpen(false)}
              >
                ×
              </button>
            </div>
            {items.length === 0 ? (
              <p className="cart-empty">Your cart is empty.</p>
            ) : (
              <ul className="cart-lines">
                {items.map(({ product, quantity, lineCents }) => (
                  <li key={product.slug} className="cart-line">
                    <img src={product.cover} alt="" width={64} height={84} />
                    <div className="cart-line-body">
                      <p className="cart-line-title">{product.title}</p>
                      <p className="cart-line-price">{formatUsd(lineCents)}</p>
                      <div className="cart-qty">
                        <label>
                          Qty
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(
                                product.slug,
                                Number(e.target.value) || 1,
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => removeItem(product.slug)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="cart-drawer-foot">
              <p className="cart-subtotal">
                Subtotal <strong>{formatUsd(subtotalCents)}</strong>
              </p>
              {checkoutError ? (
                <p className="cart-error" role="alert">
                  {checkoutError}
                </p>
              ) : null}
              <button
                type="button"
                className="shop-add cart-checkout"
                disabled={items.length === 0 || checkingOut}
                onClick={() => void checkout()}
              >
                {checkingOut ? 'Redirecting…' : 'Checkout with Stripe'}
              </button>
              {items.length > 0 ? (
                <button
                  type="button"
                  className="cart-clear"
                  onClick={() => clear()}
                >
                  Clear cart
                </button>
              ) : null}
              <Link
                className="cart-keep"
                to="/shop"
                onClick={() => setCartOpen(false)}
              >
                Keep shopping
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </SiteChrome>
  );
}
