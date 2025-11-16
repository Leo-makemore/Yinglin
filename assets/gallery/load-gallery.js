// Gallery loader - reads from gallery.json and renders images
async function loadGallery() {
  try {
    const response = await fetch('assets/gallery/gallery.json');
    const data = await response.json();
    
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    data.categories.forEach(category => {
      // Add category heading if there are multiple categories
      if (data.categories.length > 1) {
        const categoryHeading = document.createElement('h3');
        categoryHeading.className = 'gallery-category';
        categoryHeading.textContent = category.name;
        galleryGrid.appendChild(categoryHeading);
      }
      
      // Add images for this category
      category.images.forEach(image => {
        const figure = document.createElement('figure');
        figure.innerHTML = `
          <img src="assets/gallery/${image.file}" alt="${image.caption}" />
          <figcaption>${image.caption}</figcaption>
        `;
        galleryGrid.appendChild(figure);
      });
    });
  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}

// Load gallery when page loads
document.addEventListener('DOMContentLoaded', loadGallery);

