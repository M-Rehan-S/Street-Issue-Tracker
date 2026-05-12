/* report.js */

function handleUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        /* Load thumbnail */
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
        };
        reader.readAsDataURL(file);

        /* Populate filename and formatted file size */
        document.getElementById('previewFilename').textContent = file.name;
        const kb = file.size / 1024;
        document.getElementById('previewFilesize').textContent = kb >= 1024
            ? (kb / 1024).toFixed(1) + ' MB'
            : Math.round(kb) + ' KB';

        /* Hide upload area, show thumbnail pill */
        document.getElementById('uploadArea').style.display   = 'none';
        document.getElementById('imagePreview').style.display = 'inline-flex';
    }
}

function removeImage() {
    document.getElementById('repImage').value                  = '';
    document.getElementById('previewImg').src                  = '';
    document.getElementById('previewFilename').textContent     = '';
    document.getElementById('previewFilesize').textContent     = '';

    /* Show upload area again, hide thumbnail pill */
    document.getElementById('uploadArea').style.display   = 'flex';
    document.getElementById('imagePreview').style.display = 'none';
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log(`Latitude: ${lat}, Longitude: ${lon}`);
                
                // Now send this data to your Flask backend
                return (lat, lon);
            },
            (error) => {
                console.error("Error getting location: ", error.message);
                alert("Please enable location services to check for duplicates.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}



async function submitReport() {
    const location = document.getElementById('repLocation').value.trim();
    const category = document.getElementById('repCategory').value;
    const date     = document.getElementById('repDate').value;
    const desc     = document.getElementById('repDesc').value.trim();
    const imgFile  = document.getElementById('repImage').files[0];
    const lat, long = getLocation();
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
    formData.append('location',    location);
    formData.append('category',    category);
    formData.append('date',        date);
    formData.append('description', desc);
    if (imgFile) formData.append('image', imgFile);
    formData.append('latitude', lat);
    formData.append('longitude', long);

    const API = getApi();

    try {
        const res  = await fetch(API + '/report', { method: 'POST', body: formData });
        const data = await res.json();

        console.log(data); // Debug log to check response from model
        if(data.success == false || data.label != 'Pothole') {
            showToast('Submission failed: ' + (data.error || 'Unknown error'), '#f87171');
        }else if(data.success == true && data.nearby_duplicates.length > 0){
            // Call a function to confirm with the user if they want to submit anyway after showing them the nearby duplicates
        }else if (data.success && data.label == 'Pothole') {
            showToast('Report submitted successfully! 🎉');
            document.getElementById('repLocation').value = '';
            document.getElementById('repCategory').value = '';
            document.getElementById('repDate').value     = '';
            document.getElementById('repDesc').value     = '';
            removeImage(); 
        } else {
            showToast('Submission failed: ' + (data.error || 'Unknown error'), '#f87171');
        }
    } catch (e) {
        showToast('Cannot connect to backend server.', '#f87171');
    }
}

/* Set today's date as default */
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('repDate').value = today;
});
