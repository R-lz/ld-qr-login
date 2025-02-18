document.getElementById('generateQR').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linux.do')) {
      alert('仅在 linux.do 域名下工作');
      return;
    }

    // 获取 cookies
    const cookies = {};
    const cookieNames = ['cf_clearance', '_forum_session', '_t'];
    
    // 获取当前标签页的完整域名
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    // 尝试从不同的域名获取 cookies
    const domains = [
      tab.url,
      `https://${domain}`,
      'https://linux.do'
    ];

    // console.log('正在获取 cookies 从域名:', domains);

    for (const name of cookieNames) {
      let cookie = null;
      for (const domain of domains) {
        try {
          cookie = await chrome.cookies.get({
            url: domain,
            name: name
          });
          if (cookie) {
            cookies[name] = cookie.value;
            console.log(`Found ${name} in ${domain}`);
            break;
          }
        } catch (err) {
          console.log(`Error getting cookie ${name} from ${domain}:`, err);
        }
      }
      // 如果没有找到 cookie，为必需的 cookie 设置空值
      if (!cookie && name === 'cf_clearance') {
        cookies[name] = 'empty';
        console.log(`Setting empty value for ${name}`);
      }
    }

    // 从页面获取 csrfToken
    const response = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, resolve);
    });

    if (response && response.csrfToken) {
      cookies.csrfToken = response.csrfToken;
    }

    if (Object.keys(cookies).length === 0) {
      alert('No required cookies found');
      return;
    }

    // 检查是否获取到所有数据
    const requiredKeys = ['_forum_session', '_t', 'csrfToken'];
    const missingKeys = requiredKeys.filter(key => !cookies[key]);
    
    if (missingKeys.length > 0) {
      alert('Missing required values: ' + missingKeys.join(', '));
      console.log('Current cookies:', cookies);
      return;
    }

    const qrData = JSON.stringify(cookies);
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';

    new QRCode(qrCodeDiv, {
      text: qrData,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (error) {
    console.error('Error:', error);
    alert('生成二维码失败: ' + error.message);
  }
}); 