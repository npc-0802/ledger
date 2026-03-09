import { MOVIES, currentUser, setCurrentUser } from '../state.js';
import { sb, syncToSupabase, saveUserLocally, signOutUser } from './supabase.js';

// ── DISPLAY NAME ──

export async function updateDisplayName(newName) {
  const trimmed = newName.trim();
  if (trimmed.length < 2 || trimmed.length > 32) {
    window.showToast?.('Name must be 2–32 characters.', { type: 'error' });
    return false;
  }
  setCurrentUser({ ...currentUser, display_name: trimmed });
  saveUserLocally();
  try { await syncToSupabase(); } catch(_) {}
  window.renderProfile?.();
  window.showToast?.('Name updated.');
  return true;
}

// ── USERNAME ──

export async function updateUsername(newUsername) {
  const cleaned = newUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  if (cleaned.length < 3) {
    window.showToast?.('Username must be at least 3 characters.', { type: 'error' });
    return false;
  }

  // Rate limit: once per 30 days
  const lastChange = currentUser.username_changed_at;
  if (lastChange && (Date.now() - new Date(lastChange).getTime()) < 30 * 86400000) {
    window.showToast?.('You can change your username once per month.', { type: 'error' });
    return false;
  }

  // Uniqueness check
  try {
    const { data: existing } = await sb.from('palatemap_users')
      .select('id').eq('username', cleaned).neq('id', currentUser.id).maybeSingle();
    if (existing) {
      window.showToast?.('That username is taken.', { type: 'error' });
      return false;
    }
  } catch(e) {
    window.showToast?.('Could not verify username. Try again.', { type: 'error' });
    return false;
  }

  setCurrentUser({ ...currentUser, username: cleaned, username_changed_at: new Date().toISOString() });
  saveUserLocally();
  try { await syncToSupabase(); } catch(_) {}
  window.renderProfile?.();
  window.showToast?.('Username updated to ' + cleaned + '.');
  return true;
}

// ── DATA EXPORT ──

export function exportFullData() {
  const exportPayload = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    account: {
      id: currentUser.id,
      username: currentUser.username,
      display_name: currentUser.display_name,
      email: currentUser.email,
      archetype: currentUser.archetype,
      archetype_secondary: currentUser.archetype_secondary,
      weights: currentUser.weights,
      harmony_sensitivity: currentUser.harmony_sensitivity,
    },
    films: MOVIES.map(m => ({
      title: m.title,
      year: m.year,
      tmdb_id: m.tmdbId,
      director: m.director,
      writer: m.writer,
      cast: m.cast,
      production_companies: m.productionCompanies,
      scores: m.scores,
      total: m.total
    })),
    watchlist: (currentUser.watchlist || []).map(w => ({
      title: w.title,
      year: w.year,
      tmdb_id: w.tmdbId,
      director: w.director,
      added_at: w.addedAt
    })),
    predictions: Object.entries(currentUser.predictions || {}).map(([tmdbId, entry]) => ({
      tmdb_id: tmdbId,
      film_title: entry.film?.title,
      predicted_scores: entry.prediction?.predicted_scores,
      predicted_total: entry.predictedTotal,
      actual_total: entry.actualTotal,
      delta: entry.delta,
      confidence: entry.prediction?.confidence,
      reasoning: entry.prediction?.reasoning,
      predicted_at: entry.predictedAt,
      rated_at: entry.ratedAt
    }))
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `palatemap-export-${currentUser.username}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  window.showToast?.('Data exported.');
}

export function exportFilmsCSV() {
  const headers = ['Title', 'Year', 'Director', 'Total', 'Plot', 'Execution', 'Acting', 'Production', 'Enjoyability', 'Rewatchability', 'Ending', 'Uniqueness'];
  const rows = MOVIES.map(m => [
    `"${(m.title || '').replace(/"/g, '""')}"`,
    m.year || '',
    `"${(m.director || '').replace(/"/g, '""')}"`,
    m.total || '',
    ...['plot', 'execution', 'acting', 'production', 'enjoyability', 'rewatchability', 'ending', 'uniqueness'].map(c => m.scores?.[c] ?? '')
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `palatemap-films-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  window.showToast?.('Films exported as CSV.');
}

// ── ACCOUNT DELETION (interim — client-side) ──

let deleteConfirmStep = 0;

export function startAccountDeletion() {
  deleteConfirmStep = 1;
  renderDeleteConfirm();
}

function renderDeleteConfirm() {
  const container = document.getElementById('acct-delete-area');
  if (!container) return;

  if (deleteConfirmStep === 1) {
    container.innerHTML = `
      <div style="background:rgba(180,50,40,0.06);border:1px solid rgba(180,50,40,0.2);padding:20px;margin-top:12px">
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:16px">
          This will permanently delete your account, all your ratings, predictions, and taste data. This cannot be undone.
        </div>
        <div style="display:flex;gap:12px">
          <button class="btn btn-outline" onclick="cancelAccountDeletion()" style="font-size:12px">Cancel</button>
          <button id="acct-delete-step2-btn" class="btn" style="background:var(--red);color:white;border:none;font-size:12px;opacity:0.4;cursor:not-allowed" disabled>Continue to delete…</button>
        </div>
      </div>
    `;
    // Enable the button after 3 seconds
    setTimeout(() => {
      const btn = document.getElementById('acct-delete-step2-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.onclick = () => { deleteConfirmStep = 2; renderDeleteConfirm(); };
      }
    }, 3000);
  } else if (deleteConfirmStep === 2) {
    container.innerHTML = `
      <div style="background:rgba(180,50,40,0.06);border:1px solid rgba(180,50,40,0.2);padding:20px;margin-top:12px">
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:12px">
          Type <strong>DELETE</strong> to confirm permanent account deletion.
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <input id="acct-delete-confirm-input" class="field-input" style="max-width:180px;font-family:'DM Mono',monospace;font-size:13px;letter-spacing:1px" placeholder="DELETE" autocomplete="off">
          <button class="btn" style="background:var(--red);color:white;border:none;font-size:12px" onclick="confirmAccountDeletion()">Delete my account</button>
          <button class="btn btn-outline" onclick="cancelAccountDeletion()" style="font-size:12px">Cancel</button>
        </div>
      </div>
    `;
  }
}

export async function confirmAccountDeletion() {
  const input = document.getElementById('acct-delete-confirm-input');
  if (!input || input.value.trim().toUpperCase() !== 'DELETE') {
    window.showToast?.('Type DELETE to confirm.', { type: 'error' });
    return;
  }

  try {
    window.showToast?.('Deleting account…');

    // Delete friendships
    await sb.from('palatemap_friendships').delete().eq('requester_id', currentUser.id);
    await sb.from('palatemap_friendships').delete().eq('addressee_id', currentUser.id);

    // Delete user row
    await sb.from('palatemap_users').delete().eq('id', currentUser.id);

    // Sign out (clears localStorage + auth session)
    await signOutUser();
  } catch(e) {
    window.showToast?.('Account deletion failed. Please try again.', { type: 'error' });
  }
}

export function cancelAccountDeletion() {
  deleteConfirmStep = 0;
  const container = document.getElementById('acct-delete-area');
  if (container) container.innerHTML = '';
}

// Expose to window for inline onclick handlers
window.startAccountDeletion = startAccountDeletion;
window.confirmAccountDeletion = confirmAccountDeletion;
window.cancelAccountDeletion = cancelAccountDeletion;
