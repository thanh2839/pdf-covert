const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { API_BASE_URL } = require('../config/config');

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

/**
 * Make POST request to API
 * @param {object} data - Request data
 * @returns {Promise<object>} - Response data
 */
async function postRequest(data) {
  try {
    const response = await axios.post(API_BASE_URL, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    // Check if response has error status
    if (response.data && response.data.status && response.data.status !== 'ok') {
      throw new Error(response.data.message || 'API response status is not ok.');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || `API Error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from API. Please check your network connection.');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

/**
 * Get all documents (for duplicate check, with pagination to load all)
 * Backend uses page and page_size for pagination
 * @param {string} token - JWT token
 * @returns {Promise<object>} - Object containing all documents and total count
 */
async function getAllDocuments(token) {
  const allDocuments = [];
  let currentPage = 1;
  const pageSize = 100; // Load 100 documents per page
  let totalPages = null;
  let totalCount = null;

  // Load first page to get total_count and total_pages
  const firstRequest = {
    request_type: 'get_mentacare_documents',
    jwt_token: token,
    page: 1,
    page_size: pageSize
  };
  
  const firstResponse = await postRequest(firstRequest);
  
  // Parse response - could be wrapped in body if Lambda response
  let responseData = firstResponse;
  if (firstResponse.body) {
    try {
      responseData = typeof firstResponse.body === 'string' 
        ? JSON.parse(firstResponse.body) 
        : firstResponse.body;
    } catch (e) {
      responseData = firstResponse;
    }
  }
  
  if (responseData && responseData.documents && Array.isArray(responseData.documents)) {
    allDocuments.push(...responseData.documents);
    totalCount = responseData.total_count || responseData.documents.length;
    totalPages = responseData.total_pages || Math.ceil(totalCount / pageSize);
    
    console.log(`Loading all documents: ${totalCount} total, ${totalPages} pages`);
    
    // Load remaining pages
    for (currentPage = 2; currentPage <= totalPages; currentPage++) {
      const requestData = {
        request_type: 'get_mentacare_documents',
        jwt_token: token,
        page: currentPage,
        page_size: pageSize
      };
      
      const response = await postRequest(requestData);
      
      // Parse response
      let pageData = response;
      if (response.body) {
        try {
          pageData = typeof response.body === 'string' 
            ? JSON.parse(response.body) 
            : response.body;
        } catch (e) {
          pageData = response;
        }
      }
      
      if (pageData && pageData.documents && Array.isArray(pageData.documents)) {
        if (pageData.documents.length > 0) {
          allDocuments.push(...pageData.documents);
          console.log(`Loaded page ${currentPage}/${totalPages}: ${pageData.documents.length} documents`);
        } else {
          // No more documents
          break;
        }
      } else {
        // Unexpected response format, stop loading
        console.warn(`Unexpected response format on page ${currentPage}, stopping pagination`);
        break;
      }
    }
  } else {
    // Fallback: try old format with amount and pagging for backward compatibility
    console.warn('Response format not recognized, trying old format...');
    const fallbackRequest = {
      request_type: 'get_mentacare_documents',
      jwt_token: token,
      amount: 10000
    };
    const fallbackResponse = await postRequest(fallbackRequest);
    let fallbackData = fallbackResponse;
    if (fallbackResponse.body) {
      try {
        fallbackData = typeof fallbackResponse.body === 'string' 
          ? JSON.parse(fallbackResponse.body) 
          : fallbackResponse.body;
      } catch (e) {
        fallbackData = fallbackResponse;
      }
    }
    if (fallbackData && fallbackData.documents) {
      allDocuments.push(...(Array.isArray(fallbackData.documents) ? fallbackData.documents : []));
    }
  }

  console.log(`Loaded ${allDocuments.length} documents total for duplicate check`);
  
  return {
    documents: allDocuments,
    total_count: allDocuments.length
  };
}

module.exports = {
  uploadToAPI,
  uploadMultipleToAPI,
  getAllDocuments,
  postRequest
};
