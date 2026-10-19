{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://coloringdictionary.com/#organization",
      "name": "Coloring Dictionary",
      "url": "https://coloringdictionary.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://coloringdictionary.com/icons/icon-512.png"
      },
      "description": "A publishing brand creating dictionaries with explanations, colored guides and illustrations to color."
    },
    {
      "@type": "WebSite",
      "@id": "https://coloringdictionary.com/#website",
      "url": "https://coloringdictionary.com/",
      "name": "Coloring Dictionary",
      "publisher": { "@id": "https://coloringdictionary.com/#organization" },
      "inLanguage": "en"
    },
    {
      "@type": "CreativeWork",
      "@id": "https://coloringdictionary.com/#flower-meanings",
      "name": "Coloring Dictionary: Flower Meanings — Volume One",
      "creativeWorkStatus": "In development",
      "description": "A planned flower-meaning coloring dictionary with facing guide and coloring pages.",
      "publisher": { "@id": "https://coloringdictionary.com/#organization" },
      "inLanguage": "en",
      "hasPart": [
        {
          "@type": "Article",
          "name": "Coreopsis",
          "url": "https://coloringdictionary.com/flowers/coreopsis/"
        },
        {
          "@type": "Article",
          "name": "Pink Carnation",
          "url": "https://coloringdictionary.com/flowers/pink-carnation/"
        },
        {
          "@type": "Article",
          "name": "White Clover",
          "url": "https://coloringdictionary.com/flowers/white-clover/",
          "about": "Trifolium repens"
        }
      ]
    },
    {
      "@type": "Book",
      "@id": "https://coloringdictionary.com/#hardline",
      "name": "Hardline",
      "alternateName": "A Coloring Practice Book",
      "bookFormat": "https://schema.org/Paperback",
      "numberOfPages": 136,
      "inLanguage": "en",
      "creativeWorkStatus": "Published",
      "url": "https://www.amazon.com/dp/B0HN34HXGZ",
      "sameAs": "https://www.amazon.com/dp/B0HN34HXGZ",
      "description": "A coloring practice book with bold black outlines. Paperback, 8.5 × 11 inches, 136 pages, 60 coloring designs. Same designs as Softline, with a different line treatment.",
      "image": "https://coloringdictionary.com/assets/hardline-front-cover.webp",
      "publisher": { "@id": "https://coloringdictionary.com/#organization" }
    },
    {
      "@type": "Book",
      "@id": "https://coloringdictionary.com/#softline",
      "name": "Softline",
      "alternateName": "A Coloring Practice Book",
      "bookFormat": "https://schema.org/Paperback",
      "numberOfPages": 136,
      "inLanguage": "en",
      "creativeWorkStatus": "Published",
      "url": "https://www.amazon.com/dp/B0HN2ZBLLD",
      "sameAs": "https://www.amazon.com/dp/B0HN2ZBLLD",
      "description": "A coloring practice book with thin, light-gray guides. Paperback, 8.5 × 11 inches, 136 pages, 60 coloring designs. Opaque layers cover the guides best; transparent media may leave them visible.",
      "image": "https://coloringdictionary.com/assets/softline-front-cover.webp",
      "publisher": { "@id": "https://coloringdictionary.com/#organization" }
    },
    {
      "@type": "Book",
      "@id": "https://coloringdictionary.com/#chill-bro-hardline",
      "name": "Chill & Bro: Hardline",
      "alternateName": "Creative and fun coloring book",
      "bookFormat": "https://schema.org/Hardcover",
      "numberOfPages": 136,
      "inLanguage": "en",
      "creativeWorkStatus": "Published",
      "url": "https://www.amazon.com/dp/B0HN64QQ4M",
      "sameAs": "https://www.amazon.com/dp/B0HN64QQ4M",
      "description": "A hardcover coloring book with bold black outlines. 136 pages, 30 Chill & Bro scenes and 30 matching item pages. $19.99.",
      "image": "https://coloringdictionary.com/assets/chill-bro-hardline-front-cover.jpg",
      "publisher": { "@id": "https://coloringdictionary.com/#organization" }
    },
    {
      "@type": "Book",
      "@id": "https://coloringdictionary.com/#chill-bro-softline",
      "name": "Chill & Bro: Softline",
      "alternateName": "Creative and fun coloring book",
      "bookFormat": "https://schema.org/Hardcover",
      "numberOfPages": 136,
      "inLanguage": "en",
      "creativeWorkStatus": "Published",
      "url": "https://www.amazon.com/dp/B0HN6D89DJ",
      "sameAs": "https://www.amazon.com/dp/B0HN6D89DJ",
      "description": "A hardcover coloring book with thin, light-gray guides and the same scenes as Chill & Bro: Hardline. 136 pages. $19.99.",
      "image": "https://coloringdictionary.com/assets/chill-bro-softline-front-cover.jpg",
      "publisher": { "@id": "https://coloringdictionary.com/#organization" }
    },
    {
      "@type": "FAQPage",
      "@id": "https://coloringdictionary.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Coloring Dictionary?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Coloring Dictionary is a publishing brand that pairs readable explanations and colored examples with facing illustrations to color. Flower Meanings is its first collection."
          }
        },
        {
          "@type": "Question",
          "name": "Is Flower Meanings: Volume One available to buy?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Not yet. Volume One is in production. The images on this website show draft pages and a concept mockup."
          }
        }
      ]
    }
  ]
}
