const artworks = [
  {
    title: "侧脸与风",
    date: "2026.04.25",
    medium: "铅笔素描",
    category: "line",
    image: "artworks/amy-2026-04-25-01.jpg",
    note: "这张重点在侧脸、头发层次和衣领结构。线条轻而有方向，人物的眼神和微笑让画面带着一种刚刚转身的瞬间感。"
  },
  {
    title: "双人角色练习",
    date: "2026.04.25",
    medium: "针管笔与彩铅",
    category: "color",
    image: "artworks/amy-2026-04-25-02.jpg",
    note: "同一页里安排了两个不同气质的角色，上方更安静，下方更明亮。少量彩铅没有抢走线稿，而是用来强调头发、服装和人物性格。"
  },
  {
    title: "沉静肖像",
    date: "2026.04.25",
    medium: "铅笔素描",
    category: "line",
    image: "artworks/amy-2026-04-25-03.jpg",
    note: "这张像是一次比较完整的头像练习。脸部比例、眼睛位置和头发阴影都处理得更集中，浅灰的层次让人物显得冷静、内收。"
  },
  {
    title: "伸出的手",
    date: "2026.04.25",
    medium: "铅笔素描",
    category: "study",
    image: "artworks/amy-2026-04-25-04.jpg",
    note: "人物把手伸向画面前方，形成了更强的透视关系。手部、肩膀和表情放在一起，像一格正在发生的漫画镜头。"
  },
  {
    title: "半遮的眼神",
    date: "2026.04.25",
    medium: "铅笔素描",
    category: "line",
    image: "artworks/amy-2026-04-25-05.jpg",
    note: "头发遮住一部分眼睛，人物情绪变得更含蓄。Amy 在这张里用了更柔的灰度和边缘线，让角色看起来安静但有存在感。"
  },
  {
    title: "表情档案",
    date: "2026.04.25",
    medium: "铅笔速写",
    category: "study",
    image: "artworks/amy-2026-04-25-06.jpg",
    note: "一页里记录了多个头像和表情变化，像是在为角色寻找最合适的脸。线条保留了草稿感，也能看到观察和试错。"
  },
  {
    title: "两个视线",
    date: "2026.04.25",
    medium: "铅笔速写",
    category: "study",
    image: "artworks/amy-2026-04-25-07.jpg",
    note: "上下两个头像形成对照：一个更远、更轻，一个更近、更明确。留白让这张练习看起来像角色设定稿。"
  },
  {
    title: "站姿练习",
    date: "2026.04.25",
    medium: "铅笔速写",
    category: "study",
    image: "artworks/amy-2026-04-25-08.jpg",
    note: "这张开始从头像走向全身比例，身体线条、肩颈和衣服轮廓都在尝试建立人物的姿态。"
  },
  {
    title: "角色设定草稿",
    date: "2026.04.25",
    medium: "铅笔速写",
    category: "study",
    image: "artworks/amy-2026-04-25-09.jpg",
    note: "人物、服装和腿部结构被放在同一页里，像一张早期角色设计稿。旁边的数字记录也让它更像创作过程的一部分。"
  }
];

const gallery = document.querySelector("#gallery");
const filterButtons = document.querySelectorAll(".filter-button");
const modal = document.querySelector("#artModal");
const modalImage = document.querySelector("#modalImage");
const modalTitle = document.querySelector("#modalTitle");
const modalDate = document.querySelector("#modalDate");
const modalMedium = document.querySelector("#modalMedium");
const modalNote = document.querySelector("#modalNote");
const modalClose = document.querySelector(".modal-close");

function renderGallery(filter = "all") {
  const visibleArtworks = filter === "all"
    ? artworks
    : artworks.filter((artwork) => artwork.category === filter);

  gallery.innerHTML = visibleArtworks.map((artwork, index) => `
    <button class="art-card" type="button" data-index="${artworks.indexOf(artwork)}">
      <div class="art-frame">
        <img src="${artwork.image}" alt="${artwork.title}">
      </div>
      <div class="art-meta">
        <div>
          <h3>${artwork.title}</h3>
          <p>${artwork.medium}</p>
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

renderGallery();
