import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteChrome } from '@/components/SiteChrome';
import { StoreMarks } from '@/components/StoreMarks';
import {
  catalogAgeLabel,
  formatUsd,
  type CatalogProduct,
} from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { filterCatalog } from '@/lib/shopSearch';
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
          {!product.amazonOnly && !comingSoon ? (
            <button
              type="button"
              className="shop-add"
              onClick={() => {
                addItem(product.slug);
                onAdded();
                recordVcapHit('cart_add', '/shop', { book: product.slug });
              }}
            >
              Add to cart
            </button>
          ) : null}
          <StoreMarks
            href={product.amazonUrl || undefined}
            onClick={() =>
              recordVcapHit('amazon_cta', '/shop', { book: product.slug })
            }
          />
        </div>
      </div>
    </article>
  );
}

export function ShopPage() {
  const [searchParams] = useSearchParams();
  const { items, subtotalCents, setQuantity, removeItem, clear } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  const products = useMemo(
    () =>
      filterCatalog({
        age: searchParams.get('age'),
        q: searchParams.get('q'),
      }),
    [searchParams],
  );

  useEffect(() => {
    function openCart() {
      setCartOpen(true);
    }
    window.addEventListener('cd-open-cart', openCart);
    return () => window.removeEventListener('cd-open-cart', openCart);
  }, []);

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
        <div className="shop-layout wrap">
          <section className="shop-results">
            {products.length === 0 ? (
              <p className="shop-empty">
                No matching titles.{' '}
                <Link className="text-link" to="/shop">
                  Clear filters
                </Link>
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
