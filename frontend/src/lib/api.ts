export const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:4000'
    : 'http://localhost:4000'; // TEMP until backend is deployed
