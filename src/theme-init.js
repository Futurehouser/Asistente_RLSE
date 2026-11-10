// Aplica el tema guardado antes de pintar para evitar parpadeo
try { document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light'; } catch {}
