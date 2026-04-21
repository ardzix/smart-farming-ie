// Must stay in sync with the Django model choices
export const ASSET_TYPE_PROPS = {
  'lahan': { text: 'Lahan', color: 'volcano' }, // Increased contrast for clearer badges
  'bangunan': { text: 'Bangunan', color: 'blue' },
  'alat': { text: 'Alat', color: 'purple' },
  'ternak': { text: 'Ternak', color: 'green' },
};

export const OWNERSHIP_STATUS_CHOICES = {
  'full_ownership': 'Full Ownership',
  'partial_ownership': 'Partial Ownership',
  'investor_owned': 'Investor Owned',
  'leashold': 'Leased',
  'under_construction': 'Under Construction',
  'personal_ownership': 'Personal Ownership',
};