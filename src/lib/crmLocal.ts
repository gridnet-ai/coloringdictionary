import type { CrmContact, CrmOpportunity } from '@/lib/db/types';

const CONTACTS_KEY = 'cd.crm.contacts.v1';
const OPPORTUNITIES_KEY = 'cd.crm.opportunities.v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listContacts(): CrmContact[] {
  return readJson<CrmContact[]>(CONTACTS_KEY, []);
}

export function saveContact(contact: Omit<CrmContact, 'id' | 'createdAt'> & { id?: string }) {
  const all = listContacts();
  const id = contact.id || `crm_${crypto.randomUUID().slice(0, 8)}`;
  const next: CrmContact = {
    ...contact,
    id,
    createdAt: contact.id
      ? all.find((c) => c.id === id)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
  };
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  writeJson(CONTACTS_KEY, all);
  return next;
}

export function listOpportunities(): CrmOpportunity[] {
  return readJson<CrmOpportunity[]>(OPPORTUNITIES_KEY, []);
}

export function saveOpportunity(
  opp: Omit<CrmOpportunity, 'id'> & { id?: string },
) {
  const all = listOpportunities();
  const id = opp.id || `opp_${crypto.randomUUID().slice(0, 8)}`;
  const next: CrmOpportunity = { ...opp, id };
  const idx = all.findIndex((o) => o.id === id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  writeJson(OPPORTUNITIES_KEY, all);
  return next;
}
