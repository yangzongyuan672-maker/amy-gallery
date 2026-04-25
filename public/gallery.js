let artworks = [];
let selectedArtist = "all";
let selectedCategory = "all";
let visibleCount = 12;

const gallery = document.querySelector("#gallery");
const artistButtons = document.querySelectorAll("[data-artist]");
const categoryButtons = document.querySelectorAll("[data-category]");
const artistLinks = document.querySelectorAll("[data-artist-link]");
const collectionCount = document.querySelector("#collectionCount");
const loadMoreButton = document.querySelector("#loadMoreButton");
const modal = document.querySelector("#artModal");
const modalImage = document.querySelector("#modalImage");
const modalTitle = document.querySelector("#modalTitle");
const modalDate = document.querySelector("#modalDate");
const modalMedium = document.querySelector("#modalMedium");
const modalNote = document.querySelector("#modalNote");
const modalClose = document.querySelector(".modal-close");

async function loadArtworks() {
  try {
    const response = await fetch("/api/artworks");
    if (!response.ok) throw new Error("Failed to load artworks");
    artworks = (await response.json()).map((artwork) => ({ artist: "amy", ...artwork }));
    renderGallery();
  } catch (error) {
    gallery.innerHTML = `<p class="loading-text">作品暂时没有加载成功，请稍后刷新。</p>`;
    console.error(error);
  }
}

function renderGallery() {
  const filteredArtworks = artworks.filter((artwork) => {
    const artistMatch = selectedArtist === "all" || artwork.artist === selectedArtist;
    const categoryMatch = selectedCategory === "all" || artwork.category === selectedCategory;
    return artistMatch && categoryMatch;
  });
  const visibleArtworks = filteredArtworks.slice(0, visibleCount);

  collectionCount.textContent = `共 ${filteredArtworks.length} 张作品，当前显示 ${visibleArtworks.length} 张`;
  loadMoreButton.hidden = visibleArtworks.length >= filteredArtworks.length;

  if (!visibleArtworks.length) {
    gallery.innerHTML = `<p class="loading-text">这个分类暂时还没有作品。</p>`;
    return;
  }

  gallery.innerHTML = visibleArtworks.map((artwork, index) => `
    <button class="art-card" type="button" data-index="${artworks.indexOf(artwork)}">
      <div class="art-frame">
        <img src="${artwork.image}" alt="${escapeHtml(artwork.title)}" loading="lazy">
      </div>
      <div class="art-meta">
        <div>
          <h3>${escapeHtml(artwork.title)}</h3>
          <p>${escapeHtml(artwork.medium)}</p>
        </div>
        <span>${String(index + 1).padStart(2, "0")}</span>
      </div>
    </button>
  `).join("");
}

function openModal(artwork) {
  modalImage.src = artwork.image;
  modalImage.alt = artwork.title;
  modalTitle.textContent = artwork.title;
  modalDate.textContent = artwork.date;
  modalMedium.textContent = artwork.medium;
  modalNote.textContent = artwork.note;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

gallery.addEventListener("click", (event) => {
  const card = event.target.closest(".art-card");
  if (!card) return;
  openModal(artworks[Number(card.dataset.index)]);
});

artistButtons.forEach((button) => {
  button.addEventListener("click", () => {
    artistButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedArtist = button.dataset.artist;
    visibleCount = 12;
    renderGallery();
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedCategory = button.dataset.category;
    visibleCount = 12;
    renderGallery();
  });
});

artistLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const artist = link.dataset.artistLink;
    const button = document.querySelector(`[data-artist="${artist}"]`);
    if (button) button.click();
  });
});

loadMoreButton.addEventListener("click", () => {
  visibleCount += 12;
  renderGallery();
});

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

loadArtworks();
