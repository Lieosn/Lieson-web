const repository = 'Lieosn/Lieson-web';

document.querySelectorAll('[data-issue]').forEach(async (element) => {
  const issue = element.dataset.issue;
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/issues/${issue}`, {
      headers: {Accept: 'application/vnd.github+json'},
    });
    if (!response.ok) throw new Error('Issue unavailable');
    const data = await response.json();
    const likes = data.reactions?.['+1'] ?? 0;
    const comments = data.comments ?? 0;
    element.querySelector('[data-like-count]').textContent = likes;
    element.querySelector('[data-comment-count]').textContent = comments;
  } catch {
    element.setAttribute('hidden', '');
  }
});
