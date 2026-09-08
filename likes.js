const likeConfig = window.LIESON_SUPABASE;
const likeButtons = [...document.querySelectorAll('[data-like-toggle]')];
const likeCounts = [...document.querySelectorAll('[data-like-count]')];
const postSlug = 'write-a-problem';

const renderLikeState = (count, liked, ready = true) => {
  likeCounts.forEach((node) => { node.textContent = ready ? count : '—'; });
  likeButtons.forEach((button) => {
    button.classList.toggle('is-liked', liked);
    button.disabled = !ready;
    button.setAttribute('aria-pressed', String(liked));
    button.querySelector('[data-like-label]').textContent = liked ? '已喜欢' : '喜欢';
    button.querySelector('[data-like-icon]').textContent = liked ? '♥' : '♡';
  });
};

if (!likeConfig?.url || !likeConfig?.anonKey || !window.supabase) {
  renderLikeState(0, false, false);
} else {
  const client = window.supabase.createClient(likeConfig.url, likeConfig.anonKey);
  let currentUser = null;
  let currentCount = 0;

  const refresh = async () => {
    const [{count}, {data: {user}}] = await Promise.all([
      client.from('post_likes').select('*', {count: 'exact', head: true}).eq('post_slug', postSlug),
      client.auth.getUser(),
    ]);
    currentCount = count ?? 0;
    currentUser = user;
    let liked = false;
    if (user) {
      const {data} = await client.from('post_likes').select('user_id').eq('post_slug', postSlug).eq('user_id', user.id).maybeSingle();
      liked = Boolean(data);
    }
    renderLikeState(currentCount, liked);
  };

  likeButtons.forEach((button) => button.addEventListener('click', async () => {
    if (!currentUser) {
      await client.auth.signInWithOAuth({provider: 'github', options: {redirectTo: window.location.href}});
      return;
    }
    const liked = button.classList.contains('is-liked');
    button.disabled = true;
    if (liked) {
      await client.from('post_likes').delete().eq('post_slug', postSlug).eq('user_id', currentUser.id);
    } else {
      await client.from('post_likes').insert({post_slug: postSlug, user_id: currentUser.id});
    }
    await refresh();
  }));

  client.auth.onAuthStateChange(() => { refresh(); });
  refresh();
}
