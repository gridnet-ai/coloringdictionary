import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SiteChrome } from '@/components/SiteChrome';
import { FAQS } from '@/lib/siteSeo';
import { FLOWERS } from '@/lib/flowers';
import { recordVcapHit } from '@/lib/vcapTracking';

export function HomePage() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewAlt, setPreviewAlt] = useState('');
  const [status, setStatus] = useState('Email signup is coming soon.');

  useEffect(() => {
    recordVcapHit('origin_html', '/');
  }, []);

  function openPreview(src: string, alt: string) {
    setPreviewSrc(src);
    setPreviewAlt(alt);
    dialogRef.current?.showModal();
    recordVcapHit('preview_open', src, { alt });
  }

  async function onSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('email');
    if (typeof email !== 'string' || !email.trim()) return;

    setStatus('Signing you up…');
    recordVcapHit('signup_intent', '/#updates');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'website',
          consent: true,
        }),
      });
      if (!response.ok) throw new Error('Signup failed');
      setStatus('You’re on the list. Look out for our first chapter.');
      form.reset();
    } catch {
      setStatus('Signup isn’t open yet. Please check back for launch updates.');
    }
  }

  return (
    <SiteChrome>
      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> A little curiosity. A lot of color.
            </p>
            <h1>
              A dictionary
              <br />
              you can <em>color.</em>
            </h1>
            <p className="intro">
              Get to know the world, one page at a time. A guide to discover. A
              picture to make your own.
            </p>
            <div className="actions">
              <a className="button" href="#collection">
                Explore Flower Meanings <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#how">
                Take a peek inside <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="hero-note">For curious minds of all ages.</p>
          </div>
          <div className="hero-art">
            <div className="art-heading">
              <span>FIRST COLLECTION</span>
              <span>FLOWER MEANINGS / VOL. 01</span>
            </div>
            <button
              className="preview"
              type="button"
              aria-label="Enlarge the white clover sample spread"
              onClick={() =>
                openPreview(
                  '/assets/spread-white-clover.png',
                  'Open book with a colored white clover guide on the left and its coloring page on the right',
                )
              }
            >
              <img
                src="/assets/spread-white-clover.png"
                width={1536}
                height={1024}
                alt="Open book with a colored white clover guide on the left and its coloring page on the right"
              />
            </button>
            <div className="art-footer">
              <span>Learn a little. Make it yours.</span>
              <span className="circle-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
            <p className="small-note">Concept preview of pages in development.</p>
          </div>
        </section>

        <div className="brand-strip" aria-label="Color Learn Grow">
          <span>
            COLOR <i>✳</i>
          </span>
          <span>
            LEARN <i>✳</i>
          </span>
          <span>
            GROW <i>✳</i>
          </span>
          <span className="strip-extra" aria-hidden="true">
            COLOR <i>✳</i>
          </span>
        </div>

        <section id="how" className="wrap how">
          <div className="section-top">
            <p className="eyebrow">OPEN IT UP. LET CURIOSITY IN.</p>
            <h2>
              Two pages.
              <br />
              A whole new way to explore.
            </h2>
            <p>
              Keep the guide beside you as you color. Follow nature’s palette or
              dream up your own.
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="number">01</span>
              <h3>Meet the subject.</h3>
              <p>
                Find its name, meaning and a few memorable facts on the left-hand
                page.
              </p>
            </article>
            <article>
              <span className="number">02</span>
              <h3>Find your colors.</h3>
              <p>
                Look at the colored examples. Notice the shapes, shades and little
                details.
              </p>
            </article>
            <article>
              <span className="number">03</span>
              <h3>Make it yours.</h3>
              <p>
                Bring the facing illustration to life. There’s room for your
                imagination.
              </p>
            </article>
          </div>
        </section>

        <section id="collection" className="collection">
          <div className="wrap">
            <div className="collection-title">
              <div>
                <p className="eyebrow">OUR FIRST CHAPTER</p>
                <h2>
                  Flowers have
                  <br />
                  something to say.
                </h2>
              </div>
              <div className="collection-aside">
                <span className="pill">IN THE MAKING</span>
                <p>
                  <strong>Flower Meanings · Volume One</strong>
                  <br />
                  Explore the messages people have given flowers, from cheerful
                  coreopsis to a clover that says “Think of me.”
                </p>
              </div>
            </div>
            <div className="flower-grid">
              {FLOWERS.map((flower) => (
                <article className="flower-card" key={flower.slug}>
                  <button
                    type="button"
                    aria-label={`View ${flower.name.toLowerCase()} guide`}
                    onClick={() =>
                      openPreview(flower.image, `${flower.name} color guide`)
                    }
                  >
                    <div className="crop">
                      <img
                        src={flower.image}
                        alt={`${flower.name} color examples`}
                        loading="lazy"
                      />
                    </div>
                    <div className="flower-meta">
                      <span>
                        {flower.number} / {flower.name.toUpperCase()}
                      </span>
                      <span aria-hidden="true">↗</span>
                    </div>
                  </button>
                  <h3>{flower.meaning}</h3>
                  <Link className="entry-link" to={`/flowers/${flower.slug}/`}>
                    Read the meaning and sources ↗
                  </Link>
                  <p>{flower.phrase}</p>
                </article>
              ))}
            </div>
            <p className="collection-note">
              Sample entries from draft pages. Flower meanings vary across
              cultures and historical dictionaries; we share selected, sourced
              associations.
            </p>
          </div>
        </section>

        <section className="wrap philosophy">
          <p className="eyebrow">YOUR PAGE. YOUR PALETTE.</p>
          <h2>
            Nature gives you a guide.
            <br />
            <em>You bring the color.</em>
          </h2>
          <p>
            A quiet afternoon. A page shared with someone you love. Something new
            to discover. Start wherever curiosity takes you.
          </p>
          <a className="text-link" href="#updates">
            Follow the first collection <span aria-hidden="true">↗</span>
          </a>
        </section>

        <section id="faq" className="wrap faq">
          <p className="eyebrow">A FEW THINGS TO KNOW</p>
          <h2>Curiosity starts here.</h2>
          {FAQS.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>

        <section id="updates" className="updates wrap">
          <div>
            <p className="eyebrow">GOOD THINGS ARE GROWING</p>
            <h2>
              Be there for
              <br />
              the first chapter.
            </h2>
            <p>Book previews, new subjects and news about our first release.</p>
          </div>
          <div className="signup">
            <label htmlFor="email">Your email address</label>
            <form onSubmit={onSignup}>
              <div className="input-row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
                <button className="button" type="submit">
                  Keep me posted <span aria-hidden="true">↗</span>
                </button>
              </div>
              <p className="signup-status" aria-live="polite">
                {status}
              </p>
            </form>
            <p className="signup-note">
              A little color in your inbox. Unsubscribe anytime once signup opens.
            </p>
          </div>
        </section>
      </main>

      <dialog ref={dialogRef} id="preview-dialog">
        <button
          id="close-preview"
          type="button"
          aria-label="Close preview"
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
        <img src={previewSrc} alt={previewAlt || 'Enlarged sample book page'} />
        <p>Draft page preview</p>
      </dialog>
    </SiteChrome>
  );
}
