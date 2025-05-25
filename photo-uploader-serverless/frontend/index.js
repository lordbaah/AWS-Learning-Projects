// Replace with your API Gateway URL
const API_ENDPOINT =
  'https://your-api-id.execute-api.us-east-1.amazonaws.com/upload-url';

const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const status = document.getElementById('status');
const uploadedImages = document.getElementById('uploadedImages');

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#007bff';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '#ccc';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#ccc';
  const files = Array.from(e.dataTransfer.files).filter((file) =>
    file.type.startsWith('image/')
  );
  if (files.length > 0) {
    uploadFiles(files);
  }
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    uploadFiles(files);
  }
});

async function uploadFiles(files) {
  showStatus('Preparing uploads...', 'info');
  progressContainer.style.display = 'block';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = ((i + 1) / files.length) * 100;

    try {
      await uploadFile(file);
      progressBar.style.width = progress + '%';
      showStatus(`Uploaded ${i + 1}/${files.length} files`, 'success');
    } catch (error) {
      showStatus(`Error uploading ${file.name}: ${error.message}`, 'error');
      console.error('Upload error:', error);
    }
  }

  showStatus(`Successfully uploaded ${files.length} file(s)!`, 'success');

  // Refresh gallery after upload
  setTimeout(() => {
    loadGallery();
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
  }, 2000);
}

async function uploadFile(file) {
  // Get presigned URL
  const response = await fetch(
    `${API_ENDPOINT}/upload-url?filename=${encodeURIComponent(
      file.name
    )}&contentType=${encodeURIComponent(file.type)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get upload URL');
  }

  // Upload file to S3
  const uploadResponse = await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to S3');
  }

  // Add to uploaded images display
  addUploadedImage(file.name, data.key);
}

function addUploadedImage(filename, key) {
  const imageDiv = document.createElement('div');
  imageDiv.style.cssText =
    'margin: 10px 0; padding: 10px; background: #e9ecef; border-radius: 5px;';
  imageDiv.innerHTML = `
        <strong>📁 ${filename}</strong><br>
        <small>S3 Key: ${key}</small><br>
        <small>Uploaded: ${new Date().toLocaleString()}</small>
    `;
  uploadedImages.appendChild(imageDiv);
}

function showStatus(message, type) {
  status.innerHTML = `<div class="status ${type}">${message}</div>`;
}

// Gallery functions
async function loadGallery() {
  try {
    galleryContainer.innerHTML =
      '<div class="loading">Loading your photos...</div>';

    const response = await fetch(
      `${API_ENDPOINT}/images?generateUrls=true&limit=50`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load images');
    }

    displayGallery(data.photos);
  } catch (error) {
    console.error('Error loading gallery:', error);
    galleryContainer.innerHTML = `<div class="status error">Failed to load gallery: ${error.message}</div>`;
  }
}

function displayGallery(photos) {
  if (!photos || photos.length === 0) {
    galleryContainer.innerHTML =
      '<div class="status">No photos uploaded yet. Upload some images to see them here!</div>';
    return;
  }

  const galleryGrid = document.createElement('div');
  galleryGrid.className = 'gallery-grid';

  photos.forEach((photo) => {
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';

    const fileName = photo.photo_name.split('/').pop(); // Remove path prefix
    const fileSize = formatFileSize(photo.file_size);
    const uploadDate = new Date(photo.upload_time).toLocaleDateString();
    const uploadTime = new Date(photo.upload_time).toLocaleTimeString();

    imageCard.innerHTML = `
            ${
              photo.viewUrl
                ? `<img src="${photo.viewUrl}" alt="${fileName}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+'" />`
                : '<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No Preview Available</div>'
            }
            <div class="image-info">
                <div class="image-name">📸 ${fileName}</div>
                <div class="image-meta">📏 Size: ${fileSize}</div>
                <div class="image-meta">📅 Uploaded: ${uploadDate}</div>
                <div class="image-meta">🕒 Time: ${uploadTime}</div>
            </div>
        `;

    galleryGrid.appendChild(imageCard);
  });

  galleryContainer.innerHTML = '';
  galleryContainer.appendChild(galleryGrid);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Load gallery when page loads
window.addEventListener('load', loadGallery);
