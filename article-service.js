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

  function isSchemaMismatch(error) {
    return /column .* does not exist|schema cache/i.test(error?.message || "");
  }

  async function listPublishedLegacy(limit) {
    let query = requireClient()
      .from("articles")
      .select("id,title,slug,excerpt,attachments,published_at,created_at")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((article) => ({
      ...article,
      category: "随笔",
      tags: [],
      view_count: 0,
      like_count: 0,
      favorite_count: 0,
    }));
  }

  function getVisitorToken() {
    const key = "hutao-visitor-token";
    let token = localStorage.getItem(key);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(key, token);
    }
    return token;
  }

  async function listPublished(limit, filters = {}) {
    let query = requireClient()
      .from("articles")
      .select("id,title,slug,excerpt,attachments,category,tags,published_at,created_at,view_count,like_count,favorite_count")
      .eq("published", true)
      .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
      .order("published_at", { ascending: false });

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.search) {
      const search = filters.search.replace(/[%_,()]/g, " ").trim();
      if (search) query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }
    if (filters.tag) query = query.contains("tags", [filters.tag]);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error && isSchemaMismatch(error)) return listPublishedLegacy(limit);
    if (error) throw error;
    return data;
  }

  async function getPublished(slug) {
    let { data, error } = await requireClient()
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
      .single();
    if (error && isSchemaMismatch(error)) {
      ({ data, error } = await requireClient()
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single());
      if (data) {
        data.category = "随笔";
        data.tags = [];
        data.view_count = 0;
        data.like_count = 0;
        data.favorite_count = 0;
      }
    }
    if (error) throw error;
    return data;
  }

  async function listAllArticles() {
    const { data, error } = await requireClient()
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map((article) => ({
      category: "随笔",
      tags: [],
      view_count: 0,
      like_count: 0,
      favorite_count: 0,
      ...article,
    }));
  }

  async function listRelated(article, limit = 3) {
    let query = requireClient()
      .from("articles")
      .select("id,title,slug,excerpt,attachments,category,tags,published_at")
      .eq("published", true)
      .neq("id", article.id)
      .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (article.category) query = query.eq("category", article.category);
    const { data, error } = await query;
    if (error && isSchemaMismatch(error)) return [];
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

  async function listAllComments() {
    const { data, error } = await requireClient()
      .from("comments")
      .select("*,articles(title)")
      .order("created_at", { ascending: false });
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
    let { data, error } = await requireClient()
      .from("comments")
      .insert(comment)
      .select()
      .single();
    if (error && isSchemaMismatch(error)) {
      const legacy = {
        article_id: comment.article_id,
        visitor_name: comment.visitor_name,
        body: comment.body,
        attachments: comment.attachments,
      };
      ({ data, error } = await requireClient().from("comments").insert(legacy).select().single());
    }
    if (error) throw error;
    return data;
  }

  async function updateCommentApproval(id, approved) {
    const { error } = await requireClient().from("comments").update({ approved }).eq("id", id);
    if (error) throw error;
  }

  async function deleteComment(id) {
    const { error } = await requireClient().from("comments").delete().eq("id", id);
    if (error) throw error;
  }

  async function removeCommentFiles(files) {
    const paths = files.map((file) => file.path).filter(Boolean);
    if (!paths.length) return;
    const { error } = await requireClient().storage.from("comment-attachments").remove(paths);
    if (error) throw error;
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

  async function deleteMessage(id) {
    const { error } = await requireClient().from("guestbook_messages").delete().eq("id", id);
    if (error) throw error;
  }

  async function recordView(articleId) {
    const { data, error } = await requireClient().rpc("record_article_view", {
      target_article: articleId,
    });
    if (error && /function .* does not exist|schema cache/i.test(error.message || "")) return 0;
    if (error) throw error;
    return data;
  }

  async function toggleReaction(articleId, type) {
    const { data, error } = await requireClient().rpc("toggle_article_reaction", {
      target_article: articleId,
      target_token: getVisitorToken(),
      target_type: type,
    });
    if (error) throw error;
    localStorage.setItem(`hutao-${type}-${articleId}`, String(data.active));
    return data;
  }

  function hasReaction(articleId, type) {
    return localStorage.getItem(`hutao-${type}-${articleId}`) === "true";
  }

  window.articleService = {
    client,
    configured,
    formatDate,
    articleUrl,
    isOwner,
    firstImage,
    getVisitorToken,
    listPublished,
    getPublished,
    listAllArticles,
    listRelated,
    getSession,
    signIn,
    signOut,
    uploadFiles,
    removeFiles,
    publishArticle,
    updateArticle,
    deleteArticle,
    listComments,
    listAllComments,
    uploadCommentFiles,
    createComment,
    updateCommentApproval,
    deleteComment,
    removeCommentFiles,
    listMessages,
    createMessage,
    deleteMessage,
    recordView,
    toggleReaction,
    hasReaction,
  };
})();
