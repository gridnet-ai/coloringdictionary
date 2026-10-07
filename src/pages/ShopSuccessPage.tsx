import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteChrome } from '@/components/SiteChrome';
import { useCart } from '@/lib/cart';
import { recordVcapHit } from '@/lib/vcapTracking';

export function ShopSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { clear } = useCart();

  useEffect(() => {
    clear();
    recordVcapHit('checkout_success', '/shop/success', {
      session: sessionId || 'unknown',
    });
  }, [clear, sessionId]);

  return (
    <SiteChrome>
      <main id="main" className="shop-page wrap shop-success">
        <p className="eyebrow">ORDER RECEIVED</p>
        <h1>Thank you</h1>
        <p>
          Your payment is processing. You’ll get a receipt from Stripe by email.
          Fulfillment is confirmed by our webhook — you don’t need to stay on
          this page.
        </p>
        {sessionId ? (
          <p className="shop-session">Reference: {sessionId}</p>
        ) : null}
        <p className="shop-success-actions">
          <Link className="button" to="/shop">
            Back to catalogue
          </Link>
          <Link className="text-link" to="/">
            Home
          </Link>
        </p>
      </main>
    </SiteChrome>
  );
}
