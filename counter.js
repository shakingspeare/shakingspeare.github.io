// Views and likes, stored on our own counter (a Cloudflare Worker, source in worker/).
// Each browser counts once per story for views, and can like once.

const COUNTER = "https://counter.shakingspeare.workers.dev";
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

// On a story page: count this visit, show views, wire up the like buttons.
// The views and Like row can appear more than once (top and bottom); all copies stay in sync.
async function setupStory(slug) {
  const viewEls = document.querySelectorAll("article [data-views]");
  const btns = document.querySelectorAll(".like-btn");
  const setViews = (n) => viewEls.forEach((el) => show(el, n, "read", "reads"));
  const setLikes = (n) => btns.forEach((b) => {
    const c = b.querySelector(".count");
    if (c) c.textContent = n === null ? "…" : n;
  });

  // Show the saved numbers right away; the fresh ones replace them when they arrive.
  if (cached(`views-${slug}`) !== null) setViews(cached(`views-${slug}`));
  if (cached(`likes-${slug}`) !== null) setLikes(cached(`likes-${slug}`));

  const likedKey = `liked-${slug}`;
  if (remember(likedKey)) btns.forEach((b) => b.classList.add("liked"));
  btns.forEach((btn) => btn.addEventListener("click", async () => {
    if (btn.classList.contains("liked")) return;
    btns.forEach((b) => b.classList.add("liked"));
    btn.classList.add("pop");
    store(likedKey, "1");
    const n = await fetchCount("hit", `likes-${slug}`);
    if (n !== null) setLikes(n);
  }));

  const seenKey = `seen-${slug}`;
  const views = remember(seenKey)
    ? await fetchCount("get", `views-${slug}`)
    : await fetchCount("hit", `views-${slug}`);
  if (lastFetchOk) store(seenKey, "1"); // only when the visit was really counted
  setViews(views);

  setLikes(await fetchCount("get", `likes-${slug}`));
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
