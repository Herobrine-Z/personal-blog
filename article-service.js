(function () {
  const config = window.BLOG_CONFIG || {};
  const configured =
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.startsWith("YOUR_") &&
    !config.supabaseAnonKey.startsWith("YOUR_");

  const client =
    configured && window.supabase
      ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
      : null;

  function requireClient() {
    if (!client) {
      throw new Error("文章服务尚未配置，请先填写 supabase-config.js。");
    }
    return client;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  }

  function articleUrl(article) {
    return `./article.html?slug=${encodeURIComponent(article.slug)}`;
  }

  function isOwner(session) {
    return Boolean(session?.user?.id && session.user.id === config.ownerUserId);
  }

  function firstImage(article) {
    return (article.attachments || []).find((file) => file.type?.startsWith("image/"));
  }

  async function listPublished(limit) {
    let query = requireClient()
      .from("articles")
      .select("id,title,slug,excerpt,attachments,published_at,created_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function getPublished(slug) {
    const { data, error } = await requireClient()
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    if (error) throw error;
    return data;
  }

  async function listAllArticles() {
    const { data, error } = await requireClient()
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async function getSession() {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function signIn(email, password) {
    const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
  }

  async function uploadFiles(files, userId) {
    const uploaded = [];
    for (const file of files) {
      const cleanName = file.name.replace(/[^\w.\-]+/g, "-");
      const path = `${userId}/${crypto.randomUUID()}-${cleanName}`;
      const { error } = await requireClient().storage
        .from("article-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;

      const { data } = requireClient().storage.from("article-attachments").getPublicUrl(path);
      uploaded.push({
        name: file.name,
        path,
        url: data.publicUrl,
        type: file.type || "application/octet-stream",
        size: file.size,
      });
    }
    return uploaded;
  }

  async function removeFiles(files) {
    const paths = files.map((file) => file.path).filter(Boolean);
    if (!paths.length) return;
    const { error } = await requireClient().storage.from("article-attachments").remove(paths);
    if (error) throw error;
  }

  async function publishArticle(article) {
    const { data, error } = await requireClient()
      .from("articles")
      .insert(article)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateArticle(id, article) {
    const { data, error } = await requireClient()
      .from("articles")
      .update({ ...article, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteArticle(id) {
    const { error } = await requireClient().from("articles").delete().eq("id", id);
    if (error) throw error;
  }

  async function listComments(articleId) {
    const { data, error } = await requireClient()
      .from("comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  async function uploadCommentFiles(files, articleId) {
    const uploaded = [];
    for (const file of files) {
      const cleanName = file.name.replace(/[^\w.\-]+/g, "-") || "file";
      const path = `${articleId}/${crypto.randomUUID()}-${cleanName}`;
      const { error } = await requireClient().storage
        .from("comment-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;

      const { data } = requireClient().storage.from("comment-attachments").getPublicUrl(path);
      uploaded.push({
        name: file.name,
        path,
        url: data.publicUrl,
        type: file.type || "application/octet-stream",
        size: file.size,
      });
    }
    return uploaded;
  }

  async function createComment(comment) {
    const { data, error } = await requireClient()
      .from("comments")
      .insert(comment)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function listMessages(limit = 20) {
    const { data, error } = await requireClient()
      .from("guestbook_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async function createMessage(message) {
    const { data, error } = await requireClient()
      .from("guestbook_messages")
      .insert(message)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  window.articleService = {
    client,
    configured,
    formatDate,
    articleUrl,
    isOwner,
    firstImage,
    listPublished,
    getPublished,
    listAllArticles,
    getSession,
    signIn,
    signOut,
    uploadFiles,
    removeFiles,
    publishArticle,
    updateArticle,
    deleteArticle,
    listComments,
    uploadCommentFiles,
    createComment,
    listMessages,
    createMessage,
  };
})();
