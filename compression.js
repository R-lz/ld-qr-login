function compressData(data) {
  try {
    if (typeof pako !== 'undefined') {
      const compressed = pako.deflate(data, { to: 'string' });
      return btoa(compressed);
    }
    
    return btoa(data);
  } catch (error) {
    console.error('Compression error:', error);
    return btoa(data);
  }
}

function decompressData(base64Data) {
  try {
    const data = atob(base64Data);
    
    if (typeof pako !== 'undefined') {
      return pako.inflate(data, { to: 'string' });
    }
    
    return data;
  } catch (error) {
    console.error('Decompression error:', error);
    return atob(base64Data);
  }
} 