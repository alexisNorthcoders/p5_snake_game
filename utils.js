function randomId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}
function    getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  }