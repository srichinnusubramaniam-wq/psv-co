import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const DEFAULT_SUPABASE_URL = "https://tvzsircmxoneoghsecyz.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2enNpcmNteG9uZW9naHNlY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTAwMzUsImV4cCI6MjA5NzE2NjAzNX0.ehNNz22DWx7WJzn_SH7vyLx_Ji_VimWVqrqLiBEgdUk";

const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Get custom saved credentials from localStorage if present
const getSavedCredentials = () => {
  if (typeof window === 'undefined') return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
  const customUrl = localStorage.getItem('inven_supabase_url');
  const customKey = localStorage.getItem('inven_supabase_anon_key');
  return {
    url: customUrl || SUPABASE_URL,
    key: customKey || SUPABASE_ANON_KEY
  };
};

const creds = getSavedCredentials();
export const supabase = createClient(creds.url, creds.key);

// Helper to check if real-time cloud sync is toggled ON
export function isSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('inven_supabase_sync_enabled') !== 'false';
}

// Track sync status
export interface SyncStatus {
  connected: boolean;
  tableExists: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  syncing: boolean;
}

let syncStatus: SyncStatus = {
  connected: false,
  tableExists: false,
  lastSyncedAt: null,
  error: null,
  syncing: false,
};

const listeners = new Set<(status: SyncStatus) => void>();

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void) {
  listeners.add(listener);
  listener({ ...syncStatus });
  return () => {
    listeners.delete(listener);
  };
}

function updateSyncStatus(updates: Partial<SyncStatus>) {
  syncStatus = { ...syncStatus, ...updates };
  listeners.forEach(l => l({ ...syncStatus }));
}

export function getSyncStatus() {
  return syncStatus;
}

// All sync-supported keys corresponding exactly to Supabase tables
export const SYNC_KEYS = [
  'inven_customers',
  'inven_expense_master',
  'inven_expense_records',
  'inven_generated_invoices',
  'inven_income_master',
  'inven_income_records',
  'inven_inventory',
  'inven_product_master',
  'inven_production',
  'inven_sales',
  'inven_settings',
  'inven_style_master',
  'inven_suppliers',
  'inven_transports',
  'inven_unit_master'
];

// Check connection & table existence (checking one representative table like inven_product_master)
export async function verifySupabaseSetup() {
  if (!isSyncEnabled()) {
    updateSyncStatus({
      connected: false,
      tableExists: false,
      error: null,
      syncing: false
    });
    return false;
  }
  updateSyncStatus({ syncing: true });
  try {
    const { data, error } = await supabase
      .from('inven_product_master')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01') {
        updateSyncStatus({
          connected: true,
          tableExists: false,
          error: "Table 'inven_product_master' does not exist. Please ensure your Supabase tables match the application keys.",
          syncing: false
        });
        return false;
      }
      throw error;
    }

    updateSyncStatus({
      connected: true,
      tableExists: true,
      error: null,
      syncing: false
    });
    return true;
  } catch (err: any) {
    updateSyncStatus({
      connected: false,
      tableExists: false,
      error: err.message || 'Failed to connect to Supabase.',
      syncing: false
    });
    return false;
  }
}

// Bypass reference to original storage setter to avoid triggering pushToSupabase
let bypassSetItem: ((key: string, value: string) => void) | null = null;

// Queue structure to manage sequential upsert requests per table, preventing race conditions or out-of-order execution
export const pushQueues: Record<string, {
  pendingValue: string | null;
  activePush: Promise<void> | null;
}> = {};

// Pull all keys from Supabase and write to localStorage
export async function pullFromSupabase() {
  if (!isSyncEnabled()) {
    updateSyncStatus({ syncing: false });
    return false;
  }
  updateSyncStatus({ syncing: true });
  let successCount = 0;
  let errorMessages: string[] = [];

  try {
    for (const key of SYNC_KEYS) {
      try {
        const { data, error } = await supabase
          .from(key)
          .select('*');

        if (error) {
          // If a table doesn't exist yet, we just log a warning and skip it
          console.warn(`Could not pull from table ${key}:`, error.message);
          errorMessages.push(`${key}: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          // Find the row for this key. Usually it is row.id === key or row.key === key
          const row = data.find(r => r.id === key || r.key === key) || data[0];
          if (row) {
            const value = row.value;
            if (value !== undefined && value !== null && value !== 'undefined') {
              const strVal = typeof value === 'string' ? value : JSON.stringify(value);
              if (strVal && strVal !== 'undefined' && strVal !== 'null') {
                if (bypassSetItem) {
                  bypassSetItem(key, strVal);
                } else {
                  localStorage.setItem(key, strVal);
                }
                successCount++;
              }
            }
          }
        }
      } catch (e: any) {
        console.warn(`Exception while pulling ${key}:`, e);
      }
    }

    // Dispatch event to refresh the React UI
    window.dispatchEvent(new Event('inven_localstorage_sync'));

    updateSyncStatus({
      connected: true,
      tableExists: successCount > 0,
      lastSyncedAt: new Date(),
      error: errorMessages.length > 0 ? `Synced ${successCount} tables. Warnings/Errors on: ${errorMessages.slice(0, 3).join(', ')}...` : null,
      syncing: false
    });
    return true;
  } catch (err: any) {
    console.warn('Network or sync error pulling from Supabase:', err);
    updateSyncStatus({
      error: err.message || 'Pull failed',
      syncing: false
    });
    return false;
  }
}

// Push a single key-value to Supabase
export async function pushAllToSupabase() {
  if (!isSyncEnabled()) {
    updateSyncStatus({ syncing: false });
    return false;
  }
  updateSyncStatus({ syncing: true });
  let successCount = 0;
  let errorMessages: string[] = [];

  try {
    for (const key of SYNC_KEYS) {
      const localVal = localStorage.getItem(key);
      if (localVal && localVal !== 'undefined' && localVal !== 'null') {
        try {
          let parsedValue;
          try {
            parsedValue = JSON.parse(localVal);
          } catch {
            parsedValue = localVal;
          }

          // Try upserting using 'id' as primary key first, and fallback if table uses 'key' as column name.
          const { error } = await supabase
            .from(key)
            .upsert({
              id: key,
              value: parsedValue,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (error) {
            // Check if it's a column-not-found error, which means we should try the fallback 'key' column
            const isMissingColumn = error.message?.includes('column "id"') || error.message?.includes('column "id" does not exist') || error.code === '42703';

            if (isMissingColumn) {
              console.warn(`Upsert using 'id' failed for table ${key} due to missing column. Attempting fallback with 'key' column...`);
              const { error: retryError } = await supabase
                .from(key)
                .upsert({
                  key,
                  value: parsedValue,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

              if (retryError) {
                errorMessages.push(`${key}: ${retryError.message}`);
              } else {
                successCount++;
              }
            } else {
              errorMessages.push(`${key}: ${error.message}`);
            }
          } else {
            successCount++;
          }
        } catch (e: any) {
          errorMessages.push(`${key}: ${e.message || e}`);
        }
      }
    }

    updateSyncStatus({
      connected: true,
      tableExists: successCount > 0,
      lastSyncedAt: new Date(),
      error: errorMessages.length > 0 ? `Uploaded ${successCount} tables. Warnings/Errors on: ${errorMessages.slice(0, 3).join(', ')}...` : null,
      syncing: false
    });
    return true;
  } catch (err: any) {
    updateSyncStatus({
      error: err.message || 'Push failed',
      syncing: false
    });
    return false;
  }
}

export async function pushToSupabase(key: string, valueStr: string) {
  if (!isSyncEnabled()) return;
  if (!key.startsWith('inven_')) return;
  if (!SYNC_KEYS.includes(key)) return;
  if (!valueStr || valueStr === 'undefined' || valueStr === 'null') return;

  // Initialize queue for this key if not exists
  if (!pushQueues[key]) {
    pushQueues[key] = { pendingValue: null, activePush: null };
  }

  const queue = pushQueues[key];

  // If there is an active push already, stash the latest value and let that sequence process it
  if (queue.activePush) {
    queue.pendingValue = valueStr;
    return;
  }

  // Actual push action helper
  const performPush = async (val: string) => {
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(val);
      } catch {
        parsedValue = val;
      }

      // Try upserting using 'id' as primary key first, and fallback if table uses 'key' as column name.
      const { error } = await supabase
        .from(key)
        .upsert({
          id: key,
          value: parsedValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        // Check if it's a column-not-found error, which means we should try the fallback 'key' column
        const isMissingColumn = error.message?.includes('column "id"') || error.message?.includes('column "id" does not exist') || error.code === '42703';

        if (isMissingColumn) {
          console.warn(`Upsert using 'id' failed for table ${key} due to missing column. Attempting fallback with 'key' column...`);
          // Fallback for tables that might use 'key' as column name instead of 'id'
          const { error: retryError } = await supabase
            .from(key)
            .upsert({
              key,
              value: parsedValue,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

          if (retryError) {
            console.warn(`Fallback upsert also failed for table ${key}:`, retryError.message);
            updateSyncStatus({
              error: `Upsert failed for table '${key}': ${retryError.message}`
            });
          }
        } else {
          // If network failed to fetch, log as warning
          console.warn(`Upsert failed for table ${key}:`, error.message);
          updateSyncStatus({
            error: `Upsert failed for table '${key}': ${error.message}`
          });
        }
      } else {
        updateSyncStatus({
          connected: true,
          tableExists: true,
          lastSyncedAt: new Date(),
          error: null
        });
      }
    } catch (err: any) {
      console.warn('Error pushing key to Supabase:', key, err);
    }
  };

  // Start sequential push chain
  queue.activePush = (async () => {
    await performPush(valueStr);

    // Drain any pending stashed values that accumulated during the network request
    while (queue.pendingValue !== null) {
      const nextVal = queue.pendingValue;
      queue.pendingValue = null;
      await performPush(nextVal);
    }

    queue.activePush = null;
  })();
}

// Global hook/interception of localStorage
export function initializeSupabaseSync() {
  if (typeof window === 'undefined') return;

  // Save reference to original storage methods
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  bypassSetItem = originalSetItem;

  // Clean up any corrupt "undefined" or "null" values from localStorage on startup
  SYNC_KEYS.forEach(key => {
    try {
      const val = localStorage.getItem(key);
      if (val === 'undefined' || val === 'null' || !val) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Error cleaning up startup key ${key}:`, e);
    }
  });

  // 1. Intercept localStorage.setItem
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem(key, value);
    if (key.startsWith('inven_') && SYNC_KEYS.includes(key)) {
      if (value && value !== 'undefined' && value !== 'null') {
        pushToSupabase(key, value);
      }
    }
  };

  // 2. Intercept localStorage.removeItem
  localStorage.removeItem = function (key: string) {
    originalRemoveItem(key);
    if (isSyncEnabled() && key.startsWith('inven_') && SYNC_KEYS.includes(key)) {
      supabase.from(key).delete().or(`id.eq.${key},key.eq.${key}`)
        .then(({ error }) => {
          if (error) console.warn('Error removing key from Supabase:', key, error);
        });
    }
  };

  // 3. Start real-time subscription for each sync key/table
  if (!isSyncEnabled()) {
    console.log('Supabase real-time cloud sync is currently disabled.');
    return;
  }

  try {
    SYNC_KEYS.forEach((tableName) => {
      supabase
        .channel(`rt-${tableName}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload: any) => {
            const row = payload.new;
            if (row) {
              const rowId = row.id || row.key;
              if (rowId && rowId === tableName) {
                // If we currently have an active or pending push for this table, ignore real-time changes
                // to avoid self-echoes or race condition overwrites of user actions.
                if (pushQueues[tableName]?.activePush) {
                  return;
                }
                const localVal = localStorage.getItem(tableName);
                if (row.value !== undefined && row.value !== null && row.value !== 'undefined') {
                  const remoteValStr = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
                  if (remoteValStr && remoteValStr !== 'undefined' && remoteValStr !== 'null') {
                    if (localVal !== remoteValStr) {
                      if (bypassSetItem) {
                        bypassSetItem(tableName, remoteValStr);
                      } else {
                        localStorage.setItem(tableName, remoteValStr);
                      }
                      // Dispatch event to refresh the React UI
                      window.dispatchEvent(new Event('inven_localstorage_sync'));
                    }
                  }
                }
              }
            }
          }
        )
        .subscribe();
    });
  } catch (e) {
    console.warn('Real-time subscription setup failed:', e);
  }

  // 4. Initial validation and sync
  verifySupabaseSetup().then((ready) => {
    if (ready) {
      pullFromSupabase();
    }
  });
}
