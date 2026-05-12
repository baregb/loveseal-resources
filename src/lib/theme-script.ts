export const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme-mode') || 'system';
    var resolved = saved;
    if (saved === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim()
