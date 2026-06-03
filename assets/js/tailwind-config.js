// Shared Tailwind CDN configuration for the site
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        'fmnr-green': '#00552f',
        'fmnr-mid': '#2da57f',
        'fmnr-teal': '#0dfaab',
        'fmnr-dark': '#111111',
        'fmnr-gray': '#abb8c3',
        'fmnr-base': '#f9f9f9'
      },
      fontFamily: {
        display: ['FatFrank', 'Impact', 'Arial Black', 'sans-serif'],
        body: ['Lato', 'sans-serif']
      },
      maxWidth: {
        container: '1280px'
      }
    }
  }
};
