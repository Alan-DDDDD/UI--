const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ui-eight-alpha.vercel.app' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001');

export { API_BASE_URL };