// Fotoğraf verileri
const photos = Array.from({ length: 20 }, (_, i) => {
    // Random heights between 250 and 400
    const height = Math.floor(Math.random() * (400 - 250) + 250)
    // Random widths between 300 and 500
    const width = Math.floor(Math.random() * (500 - 300) + 300)
    // Random date
    const day = Math.floor(Math.random() * 28) + 1
    const month = Math.floor(Math.random() * 12) + 1
    const year = 2021 + Math.floor(Math.random() * 3)
    const date = `${day < 10 ? "0" + day : day}.${month < 10 ? "0" + month : month}.${year}`
  
    // Determine if this photo will have multiple images (every 3rd photo)
    const hasMultipleImages = i % 3 === 0
  
    // Create array of images
    const images = hasMultipleImages
      ? Array.from({ length: 4 }, (_, imgIndex) => ({
          src: `https://source.unsplash.com/random/${width}x${height}?sig=${i}_${imgIndex}`,
          alt: `Fotoğraf ${i + 1} - ${imgIndex + 1}`,
        }))
      : [
          {
            src: `https://source.unsplash.com/random/${width}x${height}?sig=${i}`,
            alt: `Fotoğraf ${i + 1}`,
          },
        ]
  
    return {
      id: i + 1,
      images: images,
      title: `Fotoğraf ${i + 1}`,
      description: `Bu fotoğrafın açıklaması. Sevgilim ile olan güzel anılarımızdan biri. Burada daha uzun bir açıklama yazabilirsiniz. Bu anı bizim için çok özel çünkü birlikte geçirdiğimiz zamanı temsil ediyor.`,
      song: `songs/song${(i % 5) + 1}.mp3`,
      date: date,
      hasMultipleImages: hasMultipleImages,
    }
  })
  
  // DOM elementleri
  const gallery = document.querySelector(".gallery")
  const modal = document.getElementById("modal")
  const modalImage = document.getElementById("modal-image")
  const modalTitle = document.getElementById("modal-title")
  const modalDescription = document.getElementById("modal-description")
  const closeButton = document.querySelector(".close-button")
  const dateText = document.getElementById("date-text")
  const musicText = document.getElementById("music-text")
  const exploreButton = document.getElementById("explore-button")
  const favoritesButton = document.getElementById("favorites-button")
  const galleryTitle = document.getElementById("gallery-title")
  const galleryDescription = document.getElementById("gallery-description")
  const emptyFavorites = document.getElementById("empty-favorites")
  const showAllPhotosButton = document.getElementById("show-all-photos")
  const photosContainer = document.getElementById("photos-container")
  const favoriteButton = document.getElementById("favorite-button")
  const imageNavigation = document.getElementById("image-navigation")
  const prevImageButton = document.getElementById("prev-image")
  const nextImageButton = document.getElementById("next-image")
  const imageCounter = document.getElementById("image-counter")
  
  // Ses objesi
  let audioPlayer = null
  
  // Favoriler
  let favorites = []
  let showingFavorites = false
  
  // Çoklu fotoğraf için değişkenler
  let currentPhotoId = null
  let currentImageIndex = 0
  const slideshowIntervals = {}
  let modalSlideshowInterval = null
  
  // LocalStorage'dan favorileri yükle
  function loadFavorites() {
    const savedFavorites = localStorage.getItem("photoFavorites")
    if (savedFavorites) {
      favorites = JSON.parse(savedFavorites)
    }
  }
  
  // Favorileri kaydet
  function saveFavorites() {
    localStorage.setItem("photoFavorites", JSON.stringify(favorites))
  }
  
  // Favorilere ekle/çıkar
  function toggleFavorite(photoId) {
    if (favorites.includes(photoId)) {
      favorites = favorites.filter((id) => id !== photoId)
      favoriteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
        Favorilere Ekle
      `
      favoriteButton.classList.remove("favorited")
    } else {
      favorites.push(photoId)
      favoriteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        Favorilerden Çıkar
      `
      favoriteButton.classList.add("favorited")
    }
    saveFavorites()
  
    // Eğer favoriler görünümündeyse, galeriyi güncelle
    if (showingFavorites) {
      createGallery()
    }
  }
  
  // Slayt gösterisini başlat
  function startSlideshow(photoId) {
    if (slideshowIntervals[photoId]) {
      clearInterval(slideshowIntervals[photoId])
    }
  
    const photo = photos.find((p) => p.id === photoId)
    if (!photo || !photo.hasMultipleImages) return
  
    let currentIndex = 0
    const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`)
    if (!photoElement) return
  
    slideshowIntervals[photoId] = setInterval(() => {
      currentIndex = (currentIndex + 1) % photo.images.length
      const imageElement = photoElement.querySelector(".photo-image")
      if (imageElement) {
        imageElement.style.opacity = "0"
        setTimeout(() => {
          imageElement.src = photo.images[currentIndex].src
          imageElement.alt = photo.images[currentIndex].alt
          imageElement.style.opacity = "1"
        }, 300)
      }
    }, 5000)
  }
  
  // Modal slayt gösterisini başlat
  function startModalSlideshow() {
    if (modalSlideshowInterval) {
      clearInterval(modalSlideshowInterval)
    }
  
    const photo = photos.find((p) => p.id === currentPhotoId)
    if (!photo || !photo.hasMultipleImages) return
  
    modalSlideshowInterval = setInterval(() => {
      navigateImage("next")
    }, 5000)
  }
  
  // Fotoğraflar arasında gezinme
  function navigateImage(direction) {
    const photo = photos.find((p) => p.id === currentPhotoId)
    if (!photo || !photo.hasMultipleImages) return
  
    if (direction === "prev") {
      currentImageIndex = (currentImageIndex - 1 + photo.images.length) % photo.images.length
    } else {
      currentImageIndex = (currentImageIndex + 1) % photo.images.length
    }
  
    modalImage.style.opacity = "0"
    setTimeout(() => {
      modalImage.src = photo.images[currentImageIndex].src
      modalImage.alt = photo.images[currentImageIndex].alt
      modalImage.style.opacity = "1"
  
      // Sayaç güncelleme
      imageCounter.textContent = `${currentImageIndex + 1} / ${photo.images.length}`
    }, 300)
  
    // Slayt gösterisini sıfırla
    if (modalSlideshowInterval) {
      clearInterval(modalSlideshowInterval)
      startModalSlideshow()
    }
  }
  
  // Galeriyi oluştur
  function createGallery() {
    // Galeriyi temizle
    photosContainer.innerHTML = ""
  
    // Gösterilecek fotoğrafları belirle
    const photosToShow = showingFavorites ? photos.filter((photo) => favorites.includes(photo.id)) : photos
  
    // Eğer favoriler boşsa
    if (photosToShow.length === 0 && showingFavorites) {
      emptyFavorites.classList.remove("hidden")
      photosContainer.classList.add("hidden")
    } else {
      emptyFavorites.classList.add("hidden")
      photosContainer.classList.remove("hidden")
  
      photosToShow.forEach((photo, index) => {
        const photoCard = document.createElement("div")
        photoCard.className = "photo-card"
        photoCard.dataset.photoId = photo.id
        photoCard.style.animationDelay = `${index * 0.05}s`
  
        photoCard.innerHTML = `
          <div class="photo-image-container">
            <img src="${photo.images[0].src}" alt="${photo.images[0].alt}" class="photo-image">
            ${
              photo.hasMultipleImages
                ? `
              <div class="photo-multi-indicator">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                <span>${photo.images.length} fotoğraf</span>
              </div>
            `
                : ""
            }
            <div class="photo-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="21" y1="10" y2="10"></line>
              </svg>
              ${photo.date}
            </div>
          </div>
          <div class="photo-info">
            <div class="photo-title-row">
              <h3>${photo.title}</h3>
              ${
                favorites.includes(photo.id)
                  ? `
                <div class="favorite-indicator">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
              `
                  : ""
              }
            </div>
            <p>${photo.description.substring(0, 60)}...</p>
            <div class="view-button">
              Anıyı Gör
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </div>
          </div>
        `
  
        photoCard.addEventListener("click", () => openModal(photo.id))
        photosContainer.appendChild(photoCard)
  
        // Çoklu fotoğraflar için slayt gösterisi başlat
        if (photo.hasMultipleImages) {
          startSlideshow(photo.id)
        }
      })
    }
  }
  
  // Modal'ı aç
  function openModal(photoId) {
    currentPhotoId = photoId
    currentImageIndex = 0
  
    const photo = photos.find((p) => p.id === photoId)
    if (!photo) return
  
    modalTitle.textContent = photo.title
    modalDescription.textContent = photo.description
    dateText.textContent = photo.date
    musicText.textContent = `Şu an çalan: Özel Şarkımız ${(photoId % 5) + 1}`
  
    // Fotoğrafı göster
    modalImage.src = photo.images[0].src
    modalImage.alt = photo.images[0].alt
  
    // Favorilere ekle/çıkar butonunu güncelle
    if (favorites.includes(photoId)) {
      favoriteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        Favorilerden Çıkar
      `
      favoriteButton.classList.add("favorited")
    } else {
      favoriteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
        Favorilere Ekle
      `
      favoriteButton.classList.remove("favorited")
    }
  
    // Çoklu fotoğraf navigasyonu
    if (photo.hasMultipleImages) {
      imageNavigation.classList.remove("hidden")
      imageCounter.textContent = `1 / ${photo.images.length}`
      startModalSlideshow()
    } else {
      imageNavigation.classList.add("hidden")
    }
  
    modal.style.display = "block"
  
    // Önceki şarkıyı durdur
    if (audioPlayer) {
      audioPlayer.pause()
    }
  
    // Yeni şarkıyı çal
    audioPlayer = new Audio(photo.song)
    audioPlayer.play()
  
    // Scroll'u devre dışı bırak
    document.body.style.overflow = "hidden"
  }
  
  // Modal'ı kapat
  function closeModal() {
    modal.style.display = "none"
  
    // Şarkıyı durdur
    if (audioPlayer) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
    }
  
    // Modal slayt gösterisini durdur
    if (modalSlideshowInterval) {
      clearInterval(modalSlideshowInterval)
      modalSlideshowInterval = null
    }
  
    // Scroll'u etkinleştir
    document.body.style.overflow = "auto"
  }
  
  // Favorileri göster/gizle
  function toggleFavoritesView() {
    showingFavorites = !showingFavorites
  
    if (showingFavorites) {
      galleryTitle.textContent = "Favori Anılarım"
      galleryDescription.textContent =
        "En sevdiğiniz anıları burada bulabilirsiniz. Favorilerinize eklediğiniz tüm fotoğraflar burada görüntülenir."
      favoritesButton.classList.add("active")
      favoritesButton.innerHTML = `
        Tüm Anılar
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
          <circle cx="12" cy="13" r="3"></circle>
        </svg>
      `
    } else {
      galleryTitle.textContent = "Fotoğraf Galerimiz"
      galleryDescription.textContent =
        "Birlikte geçirdiğimiz en güzel anları ölümsüzleştiren fotoğraflarımız. Her bir fotoğraf, hikayemizin bir parçası."
      favoritesButton.classList.remove("active")
      favoritesButton.innerHTML = `
        Favorilerim
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `
    }
  
    createGallery()
  }
  
  // Event listeners
  closeButton.addEventListener("click", closeModal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })
  
  // ESC tuşu ile kapatma
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModal()
    }
  })
  
  // Keşfet butonuna tıklandığında galeri bölümüne kaydır
  exploreButton.addEventListener("click", () => {
    document.getElementById("gallery").scrollIntoView({ behavior: "smooth" })
  })
  
  // Favoriler butonuna tıklandığında
  favoritesButton.addEventListener("click", toggleFavoritesView)
  showAllPhotosButton.addEventListener("click", () => {
    showingFavorites = false
    toggleFavoritesView()
  })
  
  // Favorilere ekle butonuna tıklandığında
  favoriteButton.addEventListener("click", (e) => {
    e.stopPropagation()
    toggleFavorite(currentPhotoId)
  })
  
  // Fotoğraf navigasyon butonları
  prevImageButton.addEventListener("click", (e) => {
    e.stopPropagation()
    navigateImage("prev")
  })
  
  nextImageButton.addEventListener("click", (e) => {
    e.stopPropagation()
    navigateImage("next")
  })
  
  // Sayfa yüklendiğinde
  window.addEventListener("load", () => {
    loadFavorites()
    createGallery()
  })
  
  // Tüm aralıkları temizle
  window.addEventListener("beforeunload", () => {
    Object.values(slideshowIntervals).forEach((interval) => clearInterval(interval))
    if (modalSlideshowInterval) clearInterval(modalSlideshowInterval)
  })
  
  // Galeriyi oluştur
  loadFavorites()
  createGallery()
  