const RESULTS_PER_PAGE = 100;

let query = "";
let page = 0;
let chunkIndex = 1;
let loading = false;
let hasMoreChunks = true;

const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  query = searchInput.value.trim().toLowerCase();
  resetSearch();
  if (query.length >= 2) {
    search();
  }
});

loadMoreBtn.addEventListener("click", () => {
  page++;
  search();
});

function resetSearch() {
  resultsEl.innerHTML = "";
  statusEl.textContent = "";
  loadMoreBtn.classList.add("hidden");

  page = 0;
  chunkIndex = 1;
  hasMoreChunks = true;
}

async function search() {
  if (loading || !hasMoreChunks) return;
  loading = true;

  statusEl.textContent = "Searching…";

  let collected = [];

  while (collected.length < (page + 1) * RESULTS_PER_PAGE && hasMoreChunks) {
    const data = await loadChunk(chunkIndex);
    if (!data) break;

    for (const row of data) {
      const mark = row.mark?.toLowerCase();
      if (!mark) continue;

      if (mark.startsWith(query)) {
        collected.push({ score: 2, row });
      } else if (mark.includes(query)) {
        collected.push({ score: 1, row });
      }
    }

    chunkIndex++;
  }

  collected.sort((a, b) => b.score - a.score);

  renderResults(
    collected.slice(
      page * RESULTS_PER_PAGE,
      (page + 1) * RESULTS_PER_PAGE
    ).map(r => r.row)
  );

  statusEl.textContent = `Showing ${Math.min(
    (page + 1) * RESULTS_PER_PAGE,
    collected.length
  )} results`;

  if (hasMoreChunks) {
    loadMoreBtn.classList.remove("hidden");
  }

  loading = false;
}

async function loadChunk(index) {
  try {
    const res = await fetch(`json_chunks/chunk_${String(index).padStart(4, "0")}.json`);
    if (!res.ok) {
      hasMoreChunks = false;
      return null;
    }
    return await res.json();
  } catch {
    hasMoreChunks = false;
    return null;
  }
}

function formatDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "";
  const y = yyyymmdd.slice(0, 4);
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  return `${d}-${m}-${y}`; // or `${y}-${m}-${d}`
}

function renderResults(rows) {
  for (const r of rows) {
    const card = document.createElement("div");
    card.className =
      "bg-white rounded-2xl shadow-sm p-5 border border-slate-200";

    const filedDate = formatDate(r.fd);
    
    card.innerHTML = `
      <div class="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-lg transition-shadow">
    
        <!-- Image -->
        <div class="flex justify-center items-center h-48 mb-4 overflow-hidden bg-slate-100 rounded-xl">
          <img 
            src="https://tmcms-docs.uspto.gov/cases/${r.sn}/mark/large.png"
            class="object-contain h-full w-full"
            alt="${r.mark || 'Trademark'}"
            loading="lazy"
          >
        </div>
    
        <!-- Mark Name -->
        <h2 class="text-lg font-semibold text-slate-900 mb-1 truncate" title="${r.mark || ''}">
          ${r.mark || "—"}
        </h2>
    
        <!-- Owner -->
        <p class="text-xs text-slate-500 mb-2 truncate">
          Owned by: ${r.owner || "—"}
        </p>
    
        <!-- Serial -->
        <p class="text-xs text-slate-400 mb-3 truncate">
          Serial: ${r.sn || "—"}
        </p>
    
        <!-- Goods / Services -->
        <p class="text-sm text-slate-700 mb-4 line-clamp-3">
          ${r.gs || "—"}
        </p>
    
        <!-- Bottom meta -->
        <div class="mt-auto pt-3 border-t border-slate-100">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>Class ${r.pc || "—"}</span>
            <span>Filed: ${filedDate || "—"}</span>
          </div>
        </div>
    
      </div>
    `;

    resultsEl.appendChild(card);
  }
}


