let artworks = [];

const gallery = document.querySelector("#gallery");
const filterButtons = document.querySelectorAll(".filter-button");
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
    artworks = await response.json();
    renderGallery();
  } catch (error) {
    gallery.innerHTML = `<p class="loading-text">作品暂时没有加载成功，请稍后刷新。</p>`;
    console.error(error);
  }
}

function renderGallery(filter = "all") {
  const visibleArtworks = filter === "all"
    ? artworks
    : artworks.filter((artwork) => artwork.category === filter);

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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderGallery(button.dataset.filter);
  });
});

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

loadArtworks();
