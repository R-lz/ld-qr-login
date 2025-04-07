// 只在 linux.do 域名下执行
if (window.location.hostname.includes('linux.do')) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      let csrfToken = '';
      const metaToken = document.querySelector('meta[name="csrf-token"]');
      if (metaToken) {
        csrfToken = metaToken.getAttribute('content');
      }
      
      if (!csrfToken) {
        const tokenInput = document.querySelector('input[name="csrf-token"]') || 
                          document.querySelector('input[name="csrfToken"]') ||
                          document.querySelector('input[name="_csrf"]');
        if (tokenInput) {
          csrfToken = tokenInput.value;
        }
      }
      
      if (!csrfToken && window.csrfToken) {
        csrfToken = window.csrfToken;
      }

      sendResponse({ csrfToken });
    }
  });
} 