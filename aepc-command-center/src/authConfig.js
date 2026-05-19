export const msalConfig = {
  auth: {
    clientId: "7764b011-1ded-462b-8c09-d3dbbbbb1c54",
    authority: "https://login.microsoftonline.com/6fc029e9-60ff-4a01-83a2-bc98174dbba7",
    redirectUri: "https://ashy-ground-0fc2ab410.azurestaticapps.net/"
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: ["User.Read"]
};