// Cloudinary configuration for frontend uploads
export const cloudinaryConfig = {
  cloud_name: 'di39xo9hz',
  api_key: '496175613975889',
  upload_preset: 'ml_default' // Create this in Cloudinary Console
};

// Function to upload file directly to Cloudinary using unsigned upload
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.upload_preset);
  formData.append('cloud_name', cloudinaryConfig.cloud_name);
  formData.append('folder', 'community-connect');
  formData.append('public_id', `${Date.now()}-${file.name.split('.')[0]}`);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Fallback function for testing without upload preset
export const uploadToCloudinaryFallback = async (file: File): Promise<string> => {
  // Convert file to base64 for testing
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Return a placeholder URL for testing
      resolve(`https://via.placeholder.com/500x300?text=${encodeURIComponent(file.name)}`);
    };
    reader.readAsDataURL(file);
  });
};
