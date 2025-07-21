const API_BASE = "http://localhost:8000/api/v1";

export const getAllDonations = () =>
  fetch(`${API_BASE}/donations/all`).then(res => res.json());

export const getAllOrders = () =>
  fetch(`${API_BASE}/orders/all`).then(res => res.json());

export const getAllUsers = () =>
  fetch(`${API_BASE}/users/all`).then(res => res.json()); 