document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Ignore download buttons which also have href="#"
      if (this.hasAttribute('data-download')) return;

      if (href && href !== '#') {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Direct .exe download logic
  const REPO = 'JM-Grande/split';
  const FALLBACK_URL = `https://github.com/${REPO}/releases`;
  let cachedExeUrl = null;

  // Prefetch latest release
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    .then(response => {
      if (!response.ok) throw new Error('API error');
      return response.json();
    })
    .then(data => {
      if (data && data.assets) {
        const exeAsset = data.assets.find(asset => asset.name.endsWith('.exe'));
        if (exeAsset) {
          cachedExeUrl = exeAsset.browser_download_url;
        }
      }
    })
    .catch(error => {
      console.error('Failed to prefetch latest release:', error);
      // Fallback will be used if cachedExeUrl remains null
    });

  // Handle download button clicks
  document.querySelectorAll('[data-download="exe"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Use cached URL if available, otherwise fallback to releases page
      if (cachedExeUrl) {
        window.location.href = cachedExeUrl;
      } else {
        window.location.href = FALLBACK_URL;
      }
    });
  });
});
