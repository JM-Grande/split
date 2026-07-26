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

  // Feedback & Bug Report Modal Logic
  const feedbackModal = document.getElementById('feedback-modal');
  const openFeedbackBtn = document.getElementById('open-feedback-btn');
  const openFooterFeedback = document.getElementById('open-footer-feedback');
  const closeFeedbackBtn = document.getElementById('close-feedback-btn');
  const siteCloseModalBtn = document.getElementById('site-close-modal-btn');
  const siteCopyEmailBtn = document.getElementById('site-copy-email-btn');
  const SUPPORT_EMAIL = 'xopaslabs@gmail.com';

  const openModal = () => {
    if (feedbackModal) {
      feedbackModal.classList.add('open');
      feedbackModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    if (feedbackModal) {
      feedbackModal.classList.remove('open');
      feedbackModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  if (openFeedbackBtn) openFeedbackBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  if (openFooterFeedback) openFooterFeedback.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', closeModal);
  if (siteCloseModalBtn) siteCloseModalBtn.addEventListener('click', closeModal);

  if (feedbackModal) {
    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feedbackModal && feedbackModal.classList.contains('open')) {
      closeModal();
    }
  });

  if (siteCopyEmailBtn) {
    siteCopyEmailBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(SUPPORT_EMAIL);
        const originalText = siteCopyEmailBtn.innerText;
        siteCopyEmailBtn.innerText = 'Copied!';
        siteCopyEmailBtn.style.color = '#10b981';
        setTimeout(() => {
          siteCopyEmailBtn.innerText = originalText;
          siteCopyEmailBtn.style.color = '';
        }, 2500);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    });
  }
});

