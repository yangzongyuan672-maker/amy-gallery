const passwordInput = document.querySelector("#password");
const artistInput = document.querySelector("#artist");
const filesInput = document.querySelector("#files");
const uploadButton = document.querySelector("#uploadButton");
const statusText = document.querySelector("#status");
const artworkList = document.querySelector("#artworkList");

passwordInput.value = localStorage.getItem("amyAdminPassword") || "";
artistInput.value = localStorage.getItem("amySelectedArtist") || "amy";

uploadButton.addEventListener("click", async () => {
  const password = passwordInput.value.trim();
  const files = Array.from(filesInput.files || []);

  if (!password) {
    setStatus("请先输入管理密码。", true);
    return;
  }

  if (!files.length) {
    setStatus("请先选择照片。", true);
    return;
  }

  localStorage.setItem("amyAdminPassword", password);
  localStorage.setItem("amySelectedArtist", artistInput.value);
  const formData = new FormData();
  formData.append("artist", artistInput.value);
  files.forEach((file) => formData.append("artworks", file));

  uploadButton.disabled = true;
  setStatus("正在上传并生成作品说明，请稍等...");

  try {
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      headers: {
        "x-admin-password": password
      },
      body: formData
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "上传失败");
    }

    filesInput.value = "";
    setStatus(`已加入 ${result.uploaded.length} 张作品。`);
    renderArtworks(result.artworks);
  } catch (error) {
    setStatus(error.message || "上传失败，请稍后再试。", true);
  } finally {
    uploadButton.disabled = false;
  }
});

async function loadArtworks() {
  try {
    const response = await fetch("/api/artworks");
    renderArtworks(await response.json());
  } catch {
    artworkList.innerHTML = `<p class="loading-text">作品列表暂时加载失败。</p>`;
  }
}

function renderArtworks(artworks) {
  artworkList.innerHTML = artworks.slice().reverse().map((artwork) => `
    <article class="admin-artwork">
      <img src="${artwork.image}" alt="${escapeHtml(artwork.title)}">
      <div>
        <h3>${escapeHtml(artwork.title)}</h3>
        <p>${artistName(artwork.artist)} · ${escapeHtml(artwork.date)} · ${escapeHtml(artwork.medium)}</p>
        <small>${escapeHtml(artwork.note)}</small>
      </div>
    </article>
  `).join("");
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function artistName(value) {
  return value === "nancy" || value === "mom" ? "Nancy" : "Amy";
}

loadArtworks();
