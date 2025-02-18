// 只在 linux.do 域名下执行
if (window.location.hostname.includes('linux.do')) {
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
  `;

  // 与App的按钮样式保持一致
  const button = document.createElement('button');
  button.textContent = '二维码登录';
  button.style.cssText = `
    padding: 10px 20px;
    background: linear-gradient(45deg, #2196F3, #64B5F6);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // 添加图标到按钮
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icons/icon16.png');
  icon.style.width = '16px';
  icon.style.height = '16px';
  button.prepend(icon);

  button.addEventListener('mouseover', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0)';
  });

  button.addEventListener('mouseout', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(10px)';
  });

  // 监听来自 popup 的消息
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

  // 点击按钮时打开插件弹窗
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  buttonContainer.appendChild(button);
  document.body.appendChild(buttonContainer);
} 