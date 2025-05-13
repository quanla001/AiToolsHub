import API from ".";

const publicAPI = new API({
  baseURL: " http://localhost:8080",

  headers: {
    "Content-Type": "application/json",
    accept: "*/*",
  },
});

export default publicAPI;
