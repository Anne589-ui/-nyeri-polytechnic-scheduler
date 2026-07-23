import axios from "axios";

const api = axios.create({ baseURL: "https://nyeri-polytechnic-backend.onrender.com" });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const login          = (username, password) => api.post("/auth/login", { username, password }).then(r => r.data);
export const getMe          = () => api.get("/auth/me").then(r => r.data);

// Users
export const getUsers       = () => api.get("/users").then(r => r.data);
export const createUser     = (u) => api.post("/users", u).then(r => r.data);
export const deleteUser     = (id) => api.delete(`/users/${id}`).then(r => r.data);

// Courses
export const getCourses       = () => api.get("/courses").then(r => r.data);
export const addCourse        = (c) => api.post("/courses", c).then(r => r.data);
export const deleteCourse     = (id) => api.delete(`/courses/${id}`).then(r => r.data);

// Rooms
export const getRooms       = () => api.get("/rooms").then(r => r.data);
export const addRoom        = (room) => api.post("/rooms", room).then(r => r.data);
export const deleteRoom     = (id) => api.delete(`/rooms/${id}`).then(r => r.data);

// Instructors
export const getInstructors = () => api.get("/instructors").then(r => r.data);
export const addInstructor  = (inst) => api.post("/instructors", inst).then(r => r.data);
export const deleteInstructor = (id) => api.delete(`/instructors/${id}`).then(r => r.data);

// Classes
export const getClasses     = () => api.get("/classes").then(r => r.data);
export const addClass       = (cls) => api.post("/classes", cls).then(r => r.data);
export const deleteClass    = (id) => api.delete(`/classes/${id}`).then(r => r.data);

// Clashes
export const getClashes     = () => api.get("/clashes").then(r => r.data);
// Auto-generate timetable
export const generateTimetable = () => api.post("/timetable/generate").then(r => r.data);