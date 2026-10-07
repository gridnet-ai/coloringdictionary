import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SiteChrome } from '@/components/SiteChrome';
import { getFlower } from '@/lib/flowers';
import { SITE_ORIGIN } from '@/lib/coloringDictionaryBrand';
import { recordVcapHit } from '@/lib/vcapTracking';

export function FlowerPage() {
  const { slug = '' } = useParams();
  const flower = getFlower(slug);

  useEffect(() => {
    if (!flower) return;
    recordVcapHit('origin_html', `/flowers/${flower.slug}/`);
    document.title = `${flower.name} — Coloring Dictionary`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        'content',
        `${flower.name} (${flower.scientificName}): ${flower.meaning} ${flower.phrase}`,
      );
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: flower.name,
      alternativeHeadline: flower.meaning,
      description: `${flower.meaning} ${flower.phrase}`,
      about: flower.scientificName,
      image: `${SITE_ORIGIN}${flower.image}`,
      isPartOf: {
        '@type': 'CreativeWork',
        name: 'Coloring Dictionary: Flower Meanings — Volume One',
        url: `${SITE_ORIGIN}/#flower-meanings`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Coloring Dictionary',
        url: `${SITE_ORIGIN}/`,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'flower-jsonld';
    script.text = JSON.stringify(jsonLd);
    document.getElementById('flower-jsonld')?.remove();
    document.head.appendChild(script);
    return () => {
      document.getElementById('flower-jsonld')?.remove();
    };
  }, [flower]);

  if (!flower) return <Navigate to="/" replace />;

  return (
    <SiteChrome>
      <main id="main" className="wrap entry-article">
        <Link className="back-link" to="/#collection">
          ← Back to Flower Meanings
        </Link>
        <p className="eyebrow">
          — COLORING DICTIONARY — · {flower.number}
        </p>
        <h1>{flower.name}</h1>
        <p className="scientific">{flower.scientificName}</p>

        <section>
          <h2>What it means</h2>
          <p>Think of me: {flower.meaning.replace(/\.$/, '')}.</p>
          <div className="meaning-box">
            <strong>{flower.highlight}</strong>
          </div>
        </section>

        <section>
          <h2>Meet the flower</h2>
          <ul>
            {flower.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Colors in nature</h2>
          <img
            className="guide-image"
            src={flower.image}
            alt={`${flower.name} colored guide examples`}
          />
          <div className="color-swatches">
            {flower.colors.map((c) => (
              <figure key={c.label}>
                <figcaption>
                  <strong>{c.label}</strong>
                  <br />
                  {c.note}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="collection-note">{flower.caption}</p>
          <p className="collection-note">
            Natural colors are a guide. Your colors are your choice.
          </p>
        </section>
      </main>
    </SiteChrome>
  );
}
