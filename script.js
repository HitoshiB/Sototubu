
const profileKey = "sototubu-demo-profile";
const storageKey = "sototubu-demo-posts";

const nicknameInput = document.getElementById("nickname");
const countryInput = document.getElementById("country");
const statusInput = document.getElementById("status");
const messageInput = document.getElementById("message");
const postsArea = document.getElementById("posts");

let profile = { name: "", country: "", status: "在住" };
let posts = [];

try {
  const savedProfile = JSON.parse(localStorage.getItem(profileKey));

  if (savedProfile && typeof savedProfile === "object") {
    profile = {
      name: String(savedProfile.name || "").slice(0, 30),
      country: String(savedProfile.country || ""),
      status: String(savedProfile.status || "在住")
    };
  }
} catch (error) {
  profile = { name: "", country: "", status: "在住" };
}

try {
  const savedPosts = JSON.parse(localStorage.getItem(storageKey));

  if (Array.isArray(savedPosts)) {
    posts = savedPosts.filter(p =>
      typeof p === "string" ||
      (p && typeof p === "object" && typeof p.message === "string")
    ).map(p =>
      typeof p === "string"
        ? {
            message: p,
            name: "あなた",
            country: "🌏 お試し投稿",
            status: ""
          }
        : {
            message: p.message,
            name: String(p.name || "あなた"),
            country: String(p.country || "🌏 お試し投稿"),
            status: String(p.status || "")
          }
    );
  }
} catch (error) {
  posts = [];
}

nicknameInput.value = profile.name;
countryInput.value = profile.country;
statusInput.value = profile.status;

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    alert("保存できませんでした。ブラウザの設定をご確認ください。");
    return false;
  }
}

document.getElementById("saveProfile").addEventListener("click", () => {
  const name = nicknameInput.value.trim();

  if (!name) {
    alert("ニックネームを入力してください。");
    return;
  }

  if (!countryInput.value) {
    alert("国名を選択してください。");
    return;
  }

  const next = {
    name,
    country: countryInput.value,
    status: statusInput.value
  };

  if (store(profileKey, next)) {
    profile = next;
    document.getElementById("profileNotice").textContent =
      "プロフィールを保存しました。次の投稿から反映されます。";
  }
});

function showPosts() {
  postsArea.replaceChildren();

  posts.forEach((post, index) => {
    const card = document.createElement("article");
    card.className = "post";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = post.name;

    const country = document.createElement("div");
    country.className = "country";
    country.textContent = post.country +
      (post.status ? "・" + post.status : "");

    const body = document.createElement("p");
    body.className = "message";
    body.textContent = post.message;

    const remove = document.createElement("button");
    remove.className = "delete";
    remove.type = "button";
    remove.textContent = "削除する";

    remove.addEventListener("click", () => {
      if (!confirm("この投稿を削除しますか？")) return;

      const old = posts.slice();
      posts.splice(index, 1);

      if (!store(storageKey, posts)) posts = old;
      showPosts();
    });

    card.append(name, country, body, remove);
    postsArea.appendChild(card);
  });
}

document.getElementById("submit").addEventListener("click", () => {
  const message = messageInput.value.trim();

  if (!message) {
    alert("文章を入力してください。");
    return;
  }

  if (!profile.name || !profile.country) {
    alert("先にプロフィールを保存してください。");
    return;
  }

  const old = posts.slice();

  posts.unshift({
    message,
    name: profile.name,
    country: profile.country,
    status: profile.status
  });

  if (!store(storageKey, posts)) {
    posts = old;
    return;
  }

  messageInput.value = "";
  showPosts();
});

showPosts();
