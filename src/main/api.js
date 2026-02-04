const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Upload file PDF lên API
 * @param {string} pdfPath - Đường dẫn file PDF
 * @param {string} apiUrl - URL của API endpoint
 * @param {string} apiKey - API key (optional)
 * @param {object} extraFields - Các field bổ sung gửi kèm (optional)
 * @returns {Promise<object>} - Response từ API
 */
async function uploadToAPI(pdfPath, apiUrl, apiKey = null, extraFields = {}) {
  // Kiểm tra file tồn tại
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  // Tạo form data
  const form = new FormData();
  
  // Thêm file
  const fileName = path.basename(pdfPath);
  form.append('file', fs.createReadStream(pdfPath), {
    filename: fileName,
    contentType: 'application/pdf'
  });
  
  // Thêm các field bổ sung
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }

  // Cấu hình headers
  const headers = {
    ...form.getHeaders()
  };
  
  // Thêm API key nếu có
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    // Hoặc dùng header khác tùy API:
    // headers['X-API-Key'] = apiKey;
  }

  try {
    const response = await axios.post(apiUrl, form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000 // 30 seconds timeout
    });
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(`API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // No response received
      throw new Error(`No response from API: ${error.message}`);
    } else {
      // Request setup error
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * Upload nhiều files
 * @param {string[]} pdfPaths - Mảng đường dẫn files
 * @param {string} apiUrl - URL API
 * @param {string} apiKey - API key
 * @returns {Promise<object[]>} - Mảng kết quả upload
 */
async function uploadMultipleToAPI(pdfPaths, apiUrl, apiKey = null) {
  const results = [];
  
  for (const pdfPath of pdfPaths) {
    try {
      const result = await uploadToAPI(pdfPath, apiUrl, apiKey);
      results.push({ pdfPath, ...result });
    } catch (error) {
      results.push({ pdfPath, success: false, error: error.message });
    }
  }
  
  return results;
}

module.exports = {
  uploadToAPI,
  uploadMultipleToAPI
};
