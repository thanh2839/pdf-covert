const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const { API_BASE_URL } = require('../config/config')

/**
 * Make POST request to API
 */
async function postRequest(data) {
  try {
    const response = await axios.post(API_BASE_URL, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
    
    // Check if response has error status
    if (response.data && response.data.status && response.data.status !== 'ok') {
      throw new Error(response.data.message || 'API response status is not ok.')
    }
    
    return response.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || `API Error: ${error.response.status}`)
    } else if (error.request) {
      throw new Error('No response received from API. Please check your network connection.')
    } else {
      throw new Error(`Request setup error: ${error.message}`)
    }
  }
}

/**
 * Upload file to S3 using presigned URL
 * Similar to CMS uploadToS3 function in mentacare-documents.ts
 *
 * IMPORTANT: S3 presigned URLs don't support Transfer-Encoding: chunked
 * So we must read the entire file into a buffer and send with Content-Length
 */
async function uploadToS3(presignedUrl, filePath) {
  try {
    // Read entire file into buffer (required for S3 presigned URL upload)
    // S3 doesn't support chunked transfer encoding with presigned URLs
    const fileBuffer = fs.readFileSync(filePath)
    const fileSize = fileBuffer.length

    // Upload using axios with buffer (not stream)
    const response = await axios.put(presignedUrl, fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream', // Must match presigned URL
        'Content-Length': fileSize // Explicit content length to avoid chunked encoding
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000, // 5 minutes for large files
      validateStatus: function (status) {
        // S3 returns 200 on success
        return status >= 200 && status < 300
      }
    })

    if (response.status !== 200) {
      throw new Error(`Failed to upload file to S3: ${response.status} ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    if (error.response) {
      const status = error.response.status
      const statusText = error.response.statusText
      const errorData = error.response.data
      const headers = error.response.headers
      console.error(`S3 upload error details:`, {
        status,
        statusText,
        data: errorData,
        headers: headers,
        url: presignedUrl.substring(0, 150) + '...' // Log first 150 chars of URL
      })
      throw new Error(`S3 upload failed: ${status} ${statusText}`)
    }
    throw new Error(`S3 upload failed: ${error.message}`)
  }
}

/**
 * Auth Services
 */
const authService = {
  /**
   * Admin login
   */
  async login(emailOrPhone, password) {
    const requestData = {
      request_type: 'admin_login',
      email_or_phone: emailOrPhone,
      password: password
    }
    return await postRequest(requestData)
  },

  /**
   * Verify OTP for admin login
   */
  async verifyOtp(userId, otp) {
    const requestData = {
      request_type: 'admin_login_verify_otp',
      user_id: userId,
      otp: otp
    }
    return await postRequest(requestData)
  }
}

/**
 * Document Services
 */
const documentService = {
  /**
   * Get document types
   */
  async getDocumentTypes(token) {
    const requestData = {
      request_type: 'get_mentacare_document_types',
      jwt_token: token
    }
    return await postRequest(requestData)
  },

  /**
   * Get packages
   */
  async getPackages(token) {
    const requestData = {
      request_type: 'get_mentacare_packages',
      jwt_token: token
    }
    return await postRequest(requestData)
  },

  /**
   * Get document categories
   */
  async getDocumentCategories(token) {
    const requestData = {
      request_type: 'get_mentacare_document_categories',
      jwt_token: token
    }
    return await postRequest(requestData)
  },

  /**
   * Get document sets
   */
  async getDocumentSets(token) {
    const requestData = {
      request_type: 'get_mentacare_document_sets',
      jwt_token: token
    }
    return await postRequest(requestData)
  },

  /**
   * Create document
   */
  async createDocument(token, documentData) {
    const requestData = {
      request_type: 'create_mentacare_document',
      jwt_token: token,
      name: documentData.name,
      file_names: documentData.fileNames,
      // type_id, package_ids, category_ids, document_set_ids are optional - send empty/undefined if not provided
      ...(documentData.typeId && { type_id: documentData.typeId }),
      ...(documentData.packageIds && documentData.packageIds.length > 0 && { package_ids: documentData.packageIds }),
      ...(documentData.categoryIds && documentData.categoryIds.length > 0 && { category_ids: documentData.categoryIds }),
      ...(documentData.documentSetIds && documentData.documentSetIds.length > 0 && { document_set_ids: documentData.documentSetIds }),
      ...(documentData.description && { description: documentData.description }),
      ...(documentData.thumbnailNames && documentData.thumbnailNames.length > 0 && { thumbnail_names: documentData.thumbnailNames })
    }
    return await postRequest(requestData)
  },

  /**
   * Update document status
   */
  async updateDocumentStatus(token, documentId, status) {
    const requestData = {
      request_type: 'update_mentacare_document',
      jwt_token: token,
      document_id: documentId,
      status: status
    }
    return await postRequest(requestData)
  },

  /**
   * Update document with new files (overwrite)
   */
  async updateDocument(token, documentId, documentData) {
    const requestData = {
      request_type: 'update_mentacare_document',
      jwt_token: token,
      document_id: documentId,
      ...(documentData.name && { name: documentData.name }),
      ...(documentData.typeId && { type_id: documentData.typeId }),
      ...(documentData.keptFiles && { kept_files: documentData.keptFiles }),
      ...(documentData.newFileNames && { new_file_names: documentData.newFileNames }),
      ...(documentData.thumbnailNames && documentData.thumbnailNames.length > 0 && { thumbnail_names: documentData.thumbnailNames })
    }
    return await postRequest(requestData)
  },

  /**
   * Get all documents (for duplicate check, no pagination)
   */
  async getAllDocuments(token) {
    const requestData = {
      request_type: 'get_mentacare_documents',
      jwt_token: token,
      amount: 10000 // Get all documents
    }
    return await postRequest(requestData)
  },

  /**
   * Get documents with filters
   */
  async getDocuments(token, filters = {}) {
    const requestData = {
      request_type: 'get_mentacare_documents',
      jwt_token: token,
      ...(filters.typeId && { type_id: filters.typeId }),
      ...(filters.packageId && { package_id: filters.packageId }),
      ...(filters.categoryId && { category_id: filters.categoryId }),
      ...(filters.nameFilter && { name_filter: filters.nameFilter }),
      ...(filters.amount !== undefined && { amount: filters.amount }),
      ...(filters.pagging !== undefined && { pagging: filters.pagging })
    }
    return await postRequest(requestData)
  },

  /**
   * Get document by ID
   */
  async getDocumentById(token, documentId) {
    const requestData = {
      request_type: 'get_mentacare_document_by_id',
      jwt_token: token,
      document_id: documentId
    }
    return await postRequest(requestData)
  },

  /**
   * Get document download URL (presigned URL)
   */
  async getDocumentDownloadUrl(token, documentId, fileName) {
    // For now, we'll construct public S3 URL
    // In production, you might want to use a presigned URL API
    const requestData = {
      request_type: 'get_mentacare_document_download_url',
      jwt_token: token,
      document_id: documentId,
      file_name: fileName
    }
    try {
      return await postRequest(requestData)
    } catch (error) {
      // Fallback: construct public URL from S3 bucket
      // This assumes files are in public bucket
      const { S3_UPLOADS_BUCKET, AWS_REGION } = require('../config/config')
      if (S3_UPLOADS_BUCKET && AWS_REGION) {
        // This is a fallback - in production, use presigned URL from API
        return {
          presigned_url: `https://${S3_UPLOADS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/mentacare/${documentId}/${fileName}`,
          expires_in: 3600
        }
      }
      throw error
    }
  },

  /**
   * Get document thumbnail URL (presigned URL)
   */
  async getDocumentThumbnailUrl(token, documentId, thumbnailName) {
    const requestData = {
      request_type: 'get_mentacare_document_thumbnail_url',
      jwt_token: token,
      document_id: documentId,
      thumbnail_name: thumbnailName
    }
    return await postRequest(requestData)
  }
}

module.exports = {
  postRequest,
  uploadToS3,
  authService,
  documentService
}
