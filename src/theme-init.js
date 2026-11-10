// Aplica el tema antes de pintar para evitar parpadeo.
// Por defecto modo noche; solo se recuerda el tema si el usuario lo cambia con el botón.
try { document.documentElement.dataset.theme = localStorage.getItem('themeChoice') || 'dark'; } catch {
  document.documentElement.dataset.theme = 'dark';
}
