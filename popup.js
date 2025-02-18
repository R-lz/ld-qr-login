document.getElementById('generateQR').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linux.do')) {
      alert('仅在 linux.do 域名下工作');
      return;
    }

    // 获取 cookies
    const cookies = {
      'cf_clearance': 'empty',
      '_forum_session': 'empty',
    };
    
    const url = new URL(tab.url);
    const domain = url.hostname;
    console.log('当前域名:', domain);
    
    // 尝试从不同的域名获取必要的 cookies
    const domains = [
      tab.url,
      `https://${domain}`,
      'https://linux.do'
    ];

    // 获取 _t 和 _forum_session cookies
    const cookieNames = ['_t'];
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
            console.log(`Found ${name} in ${domain}:`, cookie.value);
            break;
          }
        } catch (err) {
          console.log(`Error getting cookie ${name} from ${domain}:`, err);
        }
      }
    }

    // 从页面获取 csrfToken
    console.log('正在获取 csrfToken...');
    const response = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, resolve);
    });

    if (response && response.csrfToken) {
      cookies.csrfToken = response.csrfToken;
    } else {
      console.log('未获取到 csrfToken, response:', response);
    }

    // 检查是否获取到必要数据
    const requiredKeys = ['_t', '_forum_session', 'csrfToken'];
    const missingKeys = requiredKeys.filter(key => !cookies[key]);
    
    if (missingKeys.length > 0) {
      alert('Missing required values: ' + missingKeys.join(', '));
      console.log('Current cookies:', cookies);
      return;
    }

    // 使用简单的数据格式
    const simpleData = {
      t: cookies._t,
      f: cookies._forum_session,
      c: cookies.csrfToken,
      cf: cookies.cf_clearance
    };

    const jsonStr = JSON.stringify(simpleData);

    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';

    // 创建高质量二维码
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

    // 渲染二维码
    qrCode.append(qrCodeDiv);

  } catch (error) {
    console.error('Error:', error);
    alert('生成二维码失败: ' + error.message);
  }
}); 