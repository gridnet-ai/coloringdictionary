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
        "url": "https://coloringdictionary.com/icons/favicon.png"
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
