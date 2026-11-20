
const SUPABASE_URL = "https://hwkqinchcycbxnkdy oqm.supabase.co".replace(" ", "");

// ここにSupabaseのPublishable keyを貼り付ける
const SUPABASE_KEY = "sb_publishable_zIczHQ6l22PwstM_9SqiXQ_rK0GLD-8";

const profileKey = "sototubu-demo-profile";

const nicknameInput = document.getElementById("nickname");
const countryInput = document.getElementById("country");
const statusInput = document.getElementById("status");
const messageInput = document.getElementById("message");
const postsArea = document.getElementById("posts");
const submitButton = document.getElementById("submit");

const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const signUpButton = document.getElementById("signUpButton");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

let profile = { name: "", country: "", status: "在住" };
let posts = [];
let currentUser = null;
let db = null;
async function registerEmail(email, password) {
  const { data, error } = await db.auth.updateUser({
    email: email,
    password: password
  });

  if (error) {
    alert("登録に失敗しました: " + error.message);
    return;
  }

  alert("確認メールを送信しました。メールを確認してください。");
}
function notify(message) {
  alert(message);
}

try {
  const saved = JSON.parse(localStorage.getItem(profileKey));
  if (saved && typeof saved === "object") {
    profile = {
      name: String(saved.name || "").slice(0, 30),
      country: String(saved.country || ""),
      status: String(saved.status || "在住")
    };
  }
} catch (error) {
  console.error("Profile loading error:", error);
}

nicknameInput.value = profile.name;
countryInput.value = profile.country;
statusInput.value = profile.status;

document.getElementById("saveProfile").addEventListener("click", () => {
  const name = nicknameInput.value.trim();

  if (!name) {
    notify("ニックネームを入力してください。");
    return;
  }

  if (name.length > 30) {
    notify("ニックネームは30文字以内にしてください。");
    return;
  }

  if (!countryInput.value) {
    notify("国名を選択してください。");
    return;
  }

  const next = {
    name,
    country: countryInput.value,
    status: statusInput.value
  };

  try {
    localStorage.setItem(profileKey, JSON.stringify(next));
    profile = next;

    document.getElementById("profileNotice").textContent =
      "プロフィールを保存しました。次の投稿から反映されます。";
  } catch (error) {
    notify("プロフィールを保存できませんでした。");
  }
});

function showPosts() {
  postsArea.replaceChildren();

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "まだ投稿がありません。";
    postsArea.appendChild(empty);
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "post";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = post.nickname || "名前なし";

    const country = document.createElement("div");
    country.className = "country";
    country.textContent =
      (post.country || "") +
      (post.status ? "・" + post.status : "");

    const body = document.createElement("p");
    body.className = "message";
    body.textContent = post.content || "";

    card.append(name, country, body);

    if (currentUser && post.user_id === currentUser.id) {
      const remove = document.createElement("button");
      remove.className = "delete";
      remove.type = "button";
      remove.textContent = "削除する";

      remove.addEventListener("click", async () => {
        if (!confirm("この投稿を削除しますか？")) return;

        remove.disabled = true;

        try {
          const { data, error } = await db
            .from("posts")
            .delete()
            .eq("id", post.id)
            .eq("user_id", currentUser.id)
            .select("id");

          if (error) throw error;

          if (!data || data.length === 0) {
            throw new Error("削除できませんでした。");
          }

          await loadPosts();
        } catch (error) {
          console.error(error);
          notify("削除できませんでした: " + error.message);
          remove.disabled = false;
        }
      });

      card.appendChild(remove);
    }

    postsArea.appendChild(card);
  });
}

async function loadPosts() {
  if (!db) return;

  const { data, error } = await db
    .from("posts")
    .select("id,user_id,nickname,country,status,content,created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    notify("投稿を読み込めませんでした: " + error.message);
    return;
  }

  posts = data || [];
  showPosts();
}

submitButton.addEventListener("click", async () => {
  const message = messageInput.value.trim();

  if (!message) {
    notify("文章を入力してください。");
    return;
  }

  if (message.length > 2000) {
    notify("投稿は2000文字以内にしてください。");
    return;
  }

  if (!profile.name || !profile.country) {
    notify("先にプロフィールを保存してください。");
    return;
  }

  if (!db || !currentUser) {
    notify("接続の準備ができていません。");
    return;
  }

  submitButton.disabled = true;

  try {
    const { error } = await db.from("posts").insert({
      user_id: currentUser.id,
      nickname: profile.name,
      country: profile.country,
      status: profile.status,
      content: message
    });

    if (error) throw error;

    messageInput.value = "";
    await loadPosts();
  } catch (error) {
    console.error(error);
    notify("投稿できませんでした: " + error.message);
  } finally {
    submitButton.disabled = false;
  }
});

async function initialize() {
  submitButton.disabled = true;
  postsArea.textContent = "投稿を読み込んでいます...";

  if (
    SUPABASE_KEY === "ここにPublishable keyを貼り付け"
  ) {
    postsArea.textContent =
      "SupabaseのPublishable keyを設定してください。";
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    postsArea.textContent =
      "Supabaseライブラリが読み込まれていません。";
    return;
  }

  try {
    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) throw sessionError;

    if (sessionData.session) {
      currentUser = sessionData.session.user;
    } else {
      const { data, error } =
        await db.auth.signInAnonymously();

      if (error) throw error;

      currentUser = data.user;
    }

    if (!currentUser) {
      throw new Error("ユーザーIDを取得できませんでした。");
    }

    submitButton.disabled = false;
    await loadPosts();
  } catch (error) {
    console.error(error);
    postsArea.textContent =
      "接続に失敗しました: " + error.message;
    notify("Supabaseへの接続に失敗しました。");
  }
}

initialize();
