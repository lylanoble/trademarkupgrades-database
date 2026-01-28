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

function renderResults(rows) {
  for (const r of rows) {
    const card = document.createElement("div");
    card.className =
      "bg-white rounded-2xl shadow-sm p-5 border border-slate-200";

    card.innerHTML = `
      <div class="flex flex-col h-full">
        <!-- Image container to center and crop -->
        <div class="flex justify-center items-center h-48 mb-3 overflow-hidden bg-slate-100 rounded-xl">
          <img src="https://tmcms-docs.uspto.gov/cases/${r.sn}/mark/large.png" 
              class="object-contain h-full w-full" 
              alt="${r.mark || 'Trademark'}">
        </div>

        <!-- Mark Name -->
        <h2 class="text-lg font-semibold mb-1 truncate" title="${r.mark || ''}">
          ${r.mark || ""}
        </h2>

        <!-- Serial and Class -->
        <p class="text-sm text-slate-500 mb-2 truncate">
          Serial: ${r.sn || ""} • Class ${r.pc || ""}
        </p>

        <!-- Description / GS -->
        <p class="text-sm mb-3 line-clamp-3">
          ${r.gs || ""}
        </p>

        <!-- Owner Info -->
        <div class="text-xs text-slate-400 mt-auto">
          Owner: ${r.owner || ""}<br/>
          ${r.address || ""}
        </div>
      </div>
    `;

    resultsEl.appendChild(card);
  }
}
