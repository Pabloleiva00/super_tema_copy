async function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (container) {
      try {
        const response = await fetch('../html/navbar.html');
        const html = await response.text();
        container.innerHTML = html;
      } catch (err) {
        console.error("Error loading navbar:", err);
      }
    }
  }
  
export { loadNavbar };