export function saveToLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFromLocal(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}