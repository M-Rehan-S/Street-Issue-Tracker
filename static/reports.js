/* report.js */

function handleUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        document.getElementById('uploadLabel').textContent = '📎 ' + file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    document.getElementById('repImage').value = '';
    document.getElementById('uploadLabel').textContent = 'Click to upload an image';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
}

async function submitReport() {
    const location = document.getElementById('repLocation').value.trim();
    const category = document.getElementById('repCategory').value;
    const date = document.getElementById('repDate').value;
    const desc = document.getElementById('repDesc').value.trim();
    const imgFile = document.getElementById('repImage').files[0];

    if (!location) {
        showToast('Please fill in Location.', '#f87171');
        return;
    }
    else if (!location && !category) {
        showToast('Please fill in Location and Category.', '#f87171');
        return;
    }
    else if (!category) {
        showToast('Please fill in Category.', '#f57171');
        return;
    }
    if (!imgFile) {
        showToast('Please add an image.', '#f87171');
        return;
    }

    const formData = new FormData();
    formData.append('location', location);
    formData.append('category', category);
    formData.append('date', date);
    formData.append('description', desc);
    if (imgFile) formData.append('image', imgFile);
    
    const API = "http://127.0.0.1:5000";
    
    try {
        const res = await fetch(API + '/report', { method: 'POST', body: formData });
        const data = await res.json();

        console.log(data);// Debug log to check response from model

        if (data.success && data.label == 'Pothole') {
            showToast('Report submitted successfully! 🎉');
            // Reset form
            document.getElementById('repLocation').value = '';
            document.getElementById('repCategory').value = '';
            document.getElementById('repDate').value = '';
            document.getElementById('repDesc').value = '';
            removeImage();
        } else {
            showToast('Submission failed: ' + (data.error || 'Unknown error'), '#f87171');
        }
    } catch (e) {
        showToast('Cannot connect to backend server.', '#f87171');
    }
}

// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('repDate').value = today;
});