if (typeof pako === 'undefined') {
  console.error('pako library is not loaded!');
}

async function getCurrentCookieStoreId() {
  if (chrome.runtime.getManifest().incognito === 'split') return undefined;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.cookieStoreId) return tab.cookieStoreId;

  const stores = await chrome.cookies.getAllCookieStores();
  return stores.find((store) => store.tabIds.includes(tab.id))?.id;
}

// Get all cookies
async function getAllCookies(details) {
  const storeId = await getCurrentCookieStoreId();
  if (storeId) details.storeId = storeId;

  const { partitionKey, ...detailsWithoutPartitionKey } = details;
  
  try {
    const cookiesWithPartitionKey = partitionKey
      ? await chrome.cookies.getAll(details)
      : [];

    const cookies = await chrome.cookies.getAll(detailsWithoutPartitionKey);
    
    return [...cookies, ...cookiesWithPartitionKey];
  } catch (error) {
    console.log('Error getting cookies:', error);
    return await chrome.cookies.getAll(detailsWithoutPartitionKey);
  }
}

document.getElementById('generateQR').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linux.do')) {
      alert('仅在 linux.do 域名下工作');
      return;
    }

    const cookies = {
      'cf_clearance': '',
      '_forum_session': '',
      '_t': '',
      'csrfToken': ''
    };
    
    // Construct query parameters
    const details = {
      domain: 'linux.do',
      partitionKey: {
        topLevelSite: "https://linux.do",
        hasCrossSiteAncestor: false
      }
    };
    
    // Get all cookies
    const allCookies = await getAllCookies(details);
    console.log('获取到的所有 cookies:', allCookies);
    
    for (const cookie of allCookies) {
      if (cookie.name === '_t') cookies._t = cookie.value;
      if (cookie.name === '_forum_session') cookies._forum_session = cookie.value;
      if (cookie.name === 'cf_clearance') cookies.cf_clearance = cookie.value;
    }

    const response = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, resolve);
    });

    if (response && response.csrfToken) {
      cookies.csrfToken = response.csrfToken;
    } else {
      console.log('csrfToken, response:', response);
    }

    const requiredKeys = ['_t', '_forum_session', 'csrfToken', 'cf_clearance'];
    const missingKeys = requiredKeys.filter(key => !cookies[key]);
    
    if (missingKeys.length > 0) {
      alert('Missing required values: ' + missingKeys.join(', '));
      console.log('Current cookies:', cookies);
      return;
    }

    const simpleData = {
      t: cookies._t,
      f: cookies._forum_session,
      c: cookies.csrfToken,
      cf: cookies.cf_clearance
    };

    const jsonStr = JSON.stringify(simpleData);
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';

    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      data: jsonStr,
      dotsOptions: {
        color: "#000000",
        type: "rounded",
        gradient: {
          type: "linear",
          colorStops: [
            { offset: 0, color: "#000000" },
            { offset: 1, color: "#000000" }
          ]
        }
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#000000"
      },
      cornersDotOptions: {
        type: "dot",
        color: "#000000"
      },
      qrOptions: {
        errorCorrectionLevel: 'M',
        margin: 1,
        version: 8
      }
    });

    qrCode.append(qrCodeDiv);
  } catch (error) {
    console.error('Error:', error);
    alert('生成二维码失败: ' + error.message);
  }
});

// Add copy button function
document.getElementById('copyButton').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linux.do')) {
      alert('仅在 linux.do 域名下工作');
      return;
    }

    const cookies = {
      'cf_clearance': '',
      '_forum_session': '',
      '_t': '',
      'csrfToken': ''
    };
    
    const details = {
      domain: 'linux.do',
      partitionKey: {
        topLevelSite: "https://linux.do",
        hasCrossSiteAncestor: false
      }
    };
    
    const allCookies = await getAllCookies(details);
    
    for (const cookie of allCookies) {
      if (cookie.name === '_t') cookies._t = cookie.value;
      if (cookie.name === '_forum_session') cookies._forum_session = cookie.value;
      if (cookie.name === 'cf_clearance') cookies.cf_clearance = cookie.value;
    }

    const response = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, resolve);
    });

    if (response && response.csrfToken) {
      cookies.csrfToken = response.csrfToken;
    }

    const requiredKeys = ['_t', '_forum_session', 'csrfToken', 'cf_clearance'];
    const missingKeys = requiredKeys.filter(key => !cookies[key]);
    
    if (missingKeys.length > 0) {
      alert('缺少必要的登录信息');
      return;
    }

    const simpleData = {
      t: cookies._t,
      f: cookies._forum_session,
      c: cookies.csrfToken,
      cf: cookies.cf_clearance
    };

    // 压缩数据
    const jsonStr = JSON.stringify(simpleData);
    const compressedData = compressData(jsonStr);
    
    // 用于复制的是压缩后的数据
    await navigator.clipboard.writeText(compressedData);
    
    const copyButton = document.getElementById('copyButton');
    const originalText = copyButton.innerHTML;
    copyButton.innerHTML = '<span style="font-size: 16px;">✓</span> 复制成功！';
    copyButton.style.background = 'linear-gradient(45deg, #388E3C, #66BB6A)';
    
    setTimeout(() => {
      copyButton.innerHTML = originalText;
      copyButton.style.background = 'linear-gradient(45deg, #4CAF50, #81C784)';
    }, 2000);

  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
});

// 添加调试按钮功能
document.getElementById('debugButton').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linux.do')) {
      alert('仅在 linux.do 域名下工作');
      return;
    }

    const cookies = {
      'cf_clearance': '',
      '_forum_session': '',
      '_t': '',
      'csrfToken': ''
    };
    
    const details = {
      domain: 'linux.do',
      partitionKey: {
        topLevelSite: "https://linux.do",
        hasCrossSiteAncestor: false
      }
    };
    
    const allCookies = await getAllCookies(details);
    console.log('Debug - All cookies:', allCookies);
    
    for (const cookie of allCookies) {
      if (cookie.name === '_t') cookies._t = cookie.value;
      if (cookie.name === '_forum_session') cookies._forum_session = cookie.value;
      if (cookie.name === 'cf_clearance') cookies.cf_clearance = cookie.value;
    }

    const response = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, resolve);
    });

    if (response && response.csrfToken) {
      cookies.csrfToken = response.csrfToken;
    }

    const simpleData = {
      t: cookies._t,
      f: cookies._forum_session,
      c: cookies.csrfToken,
      cf: cookies.cf_clearance
    };

    // 复制完整的 JSON 字符串
    const debugStr = JSON.stringify(simpleData);
    await navigator.clipboard.writeText(debugStr);
    
    // 显示成功提示
    const debugButton = document.getElementById('debugButton');
    const originalText = debugButton.innerHTML;
    debugButton.innerHTML = '<span style="font-size: 16px;">✓</span> 已复制调试信息';
    debugButton.style.background = 'linear-gradient(45deg, #6A1B9A, #9C27B0)';
    
    setTimeout(() => {
      debugButton.innerHTML = originalText;
      debugButton.style.background = 'linear-gradient(45deg, #9C27B0, #BA68C8)';
    }, 2000);

  } catch (error) {
    console.error('Debug Error:', error);
    alert('获取调试信息失败: ' + error.message);
  }
}); 