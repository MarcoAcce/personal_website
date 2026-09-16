const images = [
    '1.jpg',
    '2.jpeg',
    '3.jpg',
    '4.jpg'
  ];
   
  const avatar = document.getElementById('picture');
   
  function showRandomImage() {
    const file = images[Math.floor(Math.random() * images.length)];
    avatar.src = `media/${file}`;
  }
   
  showRandomImage();              
  setInterval(showRandomImage, 60000); 