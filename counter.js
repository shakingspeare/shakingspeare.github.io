// Views and likes, stored on a free public counter (abacus.jasoncameron.dev).
// Each browser counts once per story for views, and can like once.

const COUNTER = "https://abacus.jasoncameron.dev";
// Local previews use a separate namespace so they do not add to the real numbers.
const NS = location.hostname.endsWith("github.io") ? "shakingspeare" : "shakingspeare-dev";

function remember(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

// The last number this browser saw, so a slow counter does not leave "…" on the page.
function cached(key) {
  const v = remember(`count-${key}`);
  return v === null ? null : Number(v);
}

let lastFetchOk = false; // false when the number came from the saved copy

async function fetchCount(action, key) {
  lastFetchOk = false;
  try {
    const res = await fetch(`${COUNTER}/${action}/${NS}/${key}`);
    if (!res.ok) return cached(key);
    const data = await res.json();
    const value = data.value || 0;
    store(`count-${key}`, String(value));
    lastFetchOk = true;
    return value;
  } catch (e) {
    return cached(key);
  }
}

function show(el, n, one, many) {
  if (!el) return;
  el.textContent = n === null ? "…" : `${n} ${n === 1 ? one : many}`;
}

// On a story page: count this visit, show views, wire up the like button.
async function setupStory(slug) {
  const viewsEl = document.querySelector("[data-views]");
  const btn = document.querySelector(".like-btn");
  const likesEl = btn && btn.querySelector(".count");

  // Show the saved numbers right away; the fresh ones replace them when they arrive.
  if (cached(`views-${slug}`) !== null) show(viewsEl, cached(`views-${slug}`), "read", "reads");
  if (likesEl && cached(`likes-${slug}`) !== null) likesEl.textContent = cached(`likes-${slug}`);

  const seenKey = `seen-${slug}`;
  const views = remember(seenKey)
    ? await fetchCount("get", `views-${slug}`)
    : await fetchCount("hit", `views-${slug}`);
  if (lastFetchOk) store(seenKey, "1"); // only when the visit was really counted
  show(viewsEl, views, "read", "reads");

  const likedKey = `liked-${slug}`;
  const likes = await fetchCount("get", `likes-${slug}`);
  if (likesEl) likesEl.textContent = likes === null ? "…" : likes;
  if (!btn) return;

  if (remember(likedKey)) btn.classList.add("liked");

  btn.addEventListener("click", async () => {
    if (btn.classList.contains("liked")) return;
    btn.classList.add("liked", "pop");
    store(likedKey, "1");
    const n = await fetchCount("hit", `likes-${slug}`);
    if (n !== null && likesEl) likesEl.textContent = n;
  });
}

// On the home page: fill in views and likes under each card.
async function setupCards() {
  for (const card of document.querySelectorAll("[data-slug]")) {
    const slug = card.dataset.slug;
    const cv = cached(`views-${slug}`), cl = cached(`likes-${slug}`);
    if (cv !== null) show(card.querySelector("[data-views]"), cv, "read", "reads");
    if (cl !== null && card.querySelector("[data-likes]")) card.querySelector("[data-likes]").textContent = cl;
    const [views, likes] = await Promise.all([
      fetchCount("get", `views-${slug}`),
      fetchCount("get", `likes-${slug}`),
    ]);
    show(card.querySelector("[data-views]"), views, "read", "reads");
    const l = card.querySelector("[data-likes]");
    if (l) l.textContent = likes === null ? "…" : likes;
  }
}
