/** Coloring Dictionary content & publishing schema (milestone 1). */

export type EntryType = 'flower_meaning' | 'dictionary' | 'encyclopedia';
export type VerificationStatus =
  | 'imported_unverified'
  | 'needs_review'
  | 'verified'
  | 'rejected';
export type PublicationStatus = 'draft' | 'reviewed' | 'approved' | 'rejected' | 'published';
export type AssetAvailability = 'local' | 'external_link' | 'missing' | 'unknown' | 'confirmed';
export type JobStatus =
  | 'queued'
  | 'running'
  | 'waiting_review'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type Provenance = {
  workbook?: string;
  sheet?: string;
  row?: number;
  importedAt?: string;
};

export type SourceRecord = {
  label?: string;
  url?: string;
  sourceId?: string;
  datasetVersion?: string;
  retrievedAt?: string;
  license?: string;
  attributionRequired?: boolean;
  attributionText?: string;
};

export type FlowerMeanings = {
  historical1884?: string | null;
  terryList?: string | null;
  almanac?: string | null;
  almanacNotes?: string | null;
  modern?: string | null;
  /** Our simplified publication wording — never overwritten by reimport when editorialLocked. */
  publicationAdaptation?: string | null;
};

export type FlowerEntry = {
  id: string;
  entryType: 'flower_meaning';
  slug: string;
  name: string;
  historicalName?: string | null;
  botanicalName?: string | null;
  catalogNumber?: string | null;
  meanings: FlowerMeanings;
  signatureLine?: string | null;
  alternateMessages?: string[];
  whenToSend?: string | null;
  emotionalLanes?: string[];
  matchStatus?: string | null;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  editorialLocked: boolean;
  sources: SourceRecord[];
  provenance: Provenance[];
  artwork?: {
    status?: string | null;
    fileLocation?: string | null;
    instagramReel?: string | null;
    availability?: AssetAvailability;
  };
  legacyStatus?: string | null;
  legacyPublished?: string | null;
  /** Named Firestore database this flower belongs to (`floriography`). */
  database?: 'floriography' | 'englishwords' | string;
  origin?: string | null;
  indexable?: boolean;
};

/** One contributing layer when synthesizing a sense from multiple datasets. */
export type SenseSourceLayer = {
  provider: string;
  datasetVersion?: string;
  sourceId?: string;
  role?: 'primary_definition' | 'example' | 'simpler_wording' | 'pronunciation' | 'other';
};

/**
 * One year-stamped definition snapshot.
 * Never overwrite — append when wording changes so history can be backfilled
 * (Webster 1913, future OED years, editorial revisions, etc.).
 */
export type DefinitionEdition = {
  /** Calendar year the wording represents (e.g. 1913 for Webster's Unabridged). */
  year: number;
  /** Optional finer label: "1913", "c. 1828", "2025-editorial". */
  yearLabel?: string;
  provider: string;
  datasetVersion?: string;
  definition: string;
  partOfSpeech?: string;
  synonyms?: string[];
  examples?: string[];
  license?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  /** Content fingerprint for idempotent reimport. */
  contentHash?: string;
};

/**
 * Individual sense for dictionary words (illustration targets one sense).
 * Gaps are filled from additional sources without inventing unsupported facts.
 */
export type DictionarySense = {
  id: string;
  partOfSpeech?: string;
  /** Preferred/current display definition. */
  definition: string;
  /** Year of the preferred `definition` field. */
  asOfYear?: number;
  definitionSource?: string;
  publicationAdaptation?: string | null;
  examples?: string[];
  synonyms?: string[];
  pronunciation?: string;
  synsetId?: string;
  wordnetSenseId?: string | null;
  gapFlags?: string[];
  sourceLayers?: SenseSourceLayer[];
  /**
   * Inline history (recent editions). Full archive also lives in
   * `entries/{id}/definitionEditions` for unlimited backfill.
   */
  definitionHistory?: DefinitionEdition[];
};

export type DictionaryEntry = {
  id: string;
  entryType: 'dictionary';
  lemma: string;
  language: string;
  senses: DictionarySense[];
  verificationStatus: VerificationStatus;
  editorialLocked: boolean;
  sources: SourceRecord[];
  provenance: Provenance[];
  synthesis?: {
    strategy: 'fill_gaps_from_sources';
    primarySource: string;
    pendingSources?: string[];
  };
  /** Years represented across senses / edition archive (for filtering). */
  definitionYears?: number[];
};

export type EncyclopediaEntry = {
  id: string;
  entryType: 'encyclopedia';
  title: string;
  slug: string;
  summary?: string;
  body?: string;
  facts?: string[];
  relatedEntryIds?: string[];
  verificationStatus: VerificationStatus;
  editorialLocked: boolean;
  sources: SourceRecord[];
  provenance: Provenance[];
};

export type CreativeAsset = {
  id: string;
  kind:
    | 'cover'
    | 'guide_raster'
    | 'coloring_raster'
    | 'page_pdf'
    | 'marketing_preview'
    | 'interior_preview'
    | 'product_lifestyle'
    | 'product_detail'
    | 'logo'
    | 'other';
  path?: string;
  externalUrl?: string;
  bookId?: string;
  entryId?: string;
  /** Marketing / product taxonomy for later storefront & ads. */
  audience?: 'adult' | 'child' | 'family' | 'mixed' | 'general';
  labels?: string[];
  title?: string;
  alt?: string;
  status: PublicationStatus | 'concept' | 'draft';
  availability: AssetAvailability;
  isMarketingMockup?: boolean;
  /** True for lifestyle product photos reserved for later marketing use. */
  isProductImage?: boolean;
  printCheck?: 'pending' | 'passed' | 'failed';
  generation?: {
    prompt?: string;
    model?: string;
    provider?: string;
    generatedAt?: string;
  };
  note?: string;
};

/** Tracker pages keep original spreadsheet headers plus normalized aliases. */
export type BookPage = Record<string, unknown> & {
  pageNumber?: number | string;
  section?: string;
  flower?: string;
  pageType?: string;
  meaning?: string;
  status?: string;
  artworkLink?: string;
  notes?: string;
};

export type BookRecord = {
  id: string;
  title: string;
  subtitle?: string;
  series?: string;
  edition?: string;
  authorImported?: string | null;
  authorCreditNeedsConfirmation?: boolean;
  coverUrl?: string | null;
  format?: string | null;
  status: string;
  language: string;
  audience?: string;
  spreadLayout: { guideSide: string; coloringSide: string };
  pages: BookPage[];
  pageCount: number;
  provenance?: Provenance;
  pinnedAssetVersions: Record<string, string>;
  creditsEditable?: boolean;
};

export type CrmContact = {
  id: string;
  name: string;
  email?: string;
  organization?: string;
  role?: string;
  type: 'reader' | 'educator' | 'retailer' | 'partner' | 'supplier' | 'other';
  notes?: string;
  nextFollowUp?: string | null;
  createdAt?: string;
};

export type CrmOpportunity = {
  id: string;
  contactId?: string;
  title: string;
  stage: string;
  value?: number | null;
  expectedClose?: string | null;
  outcome?: string | null;
};

export type ProductionJob = {
  id: string;
  type: string;
  status: JobStatus;
  bookId?: string;
  entryIds?: string[];
  attempts: number;
  lastError?: string | null;
  costUsd?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerRole = 'owner' | 'editor' | 'illustrator' | 'reviewer';
