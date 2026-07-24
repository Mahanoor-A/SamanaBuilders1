const minimalistPurple = {
  name: 'Minimalist Purple',
  id: 'minimalist-purple',
  colors: {
    primary: { DEFAULT: '#581c87', light: '#7c3aed', lighter: '#d8b4fe' },
    background: '#faf5ff',
    surface: '#ffffff',
    text: { DEFAULT: '#3f3f46', muted: '#71717a' },
    border: '#e4e4e7',
    accent: { success: '#22c55e', warning: '#f97316', danger: '#ef4444' },
  },
  gradients: {
    primary: 'linear-gradient(135deg, #581c87 0%, #7c3aed 100%)',
    hero: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #7c3aed 100%)',
    surface: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
  },
  dark: false,
};
export default minimalistPurple;
