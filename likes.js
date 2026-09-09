const likeConfig = window.LIESON_SUPABASE;
const likeRoots = [...document.querySelectorAll('[data-like-root]')];

const rootsFor = (postSlug) => likeRoots.filter((root) => root.dataset.post === postSlug);

const renderLikeState = (postSlug, count, liked, ready = true) => {
  rootsFor(postSlug).forEach((root) => {
    const button = root.querySelector('[data-like-toggle]');
    root.querySelector('[data-like-count]').textContent = ready ? count : '—';
    button.classList.toggle('is-liked', liked);
    button.disabled = !ready;
    button.setAttribute('aria-pressed', String(liked));
    button.querySelector('[data-like-label]').textContent = liked ? '已喜欢' : '喜欢';
    button.querySelector('[data-like-icon]').textContent = liked ? '♥' : '♡';
  });
};

if (!likeConfig?.url || !likeConfig?.anonKey || !window.supabase) {
  [...new Set(likeRoots.map((root) => root.dataset.post))].forEach((postSlug) => renderLikeState(postSlug, 0, false, false));
} else {
  const client = window.supabase.createClient(likeConfig.url, likeConfig.anonKey);
  let currentUser = null;

  const refreshPost = async (postSlug) => {
    const [{count}, {data: {user}}] = await Promise.all([
      client.from('post_likes').select('*', {count: 'exact', head: true}).eq('post_slug', postSlug),
      client.auth.getUser(),
    ]);
    currentUser = user;
    let liked = false;
    if (user) {
      const {data} = await client.from('post_likes').select('user_id').eq('post_slug', postSlug).eq('user_id', user.id).maybeSingle();
      liked = Boolean(data);
    }
    renderLikeState(postSlug, count ?? 0, liked);
  };

  const refreshAll = () => Promise.all([...new Set(likeRoots.map((root) => root.dataset.post))].map(refreshPost));

  likeRoots.forEach((root) => root.querySelector('[data-like-toggle]').addEventListener('click', async () => {
    const postSlug = root.dataset.post;
    if (!currentUser) {
      await client.auth.signInWithOAuth({provider: 'github', options: {redirectTo: window.location.href}});
      return;
    }
    const button = root.querySelector('[data-like-toggle]');
    const liked = button.classList.contains('is-liked');
    button.disabled = true;
    if (liked) {
      await client.from('post_likes').delete().eq('post_slug', postSlug).eq('user_id', currentUser.id);
    } else {
      await client.from('post_likes').insert({post_slug: postSlug, user_id: currentUser.id});
    }
    await refreshAll();
  }));

  client.auth.onAuthStateChange(() => { refreshAll(); });
  refreshAll();
}
