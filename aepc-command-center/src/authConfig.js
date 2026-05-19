export const msalConfig = {
  auth: {
    clientId: "7764b011-1ded-462b-8c09-d3dbbbbb1c54",
    authority: "https://login.microsoftonline.com/6fc029e9-60ff-4a01-83a2-bc98174dbba7",
    redirectUri: "https://ashy-ground-0fc2ab410.7.azurestaticapps.net",
    postLogoutRedirectUri: "https://ashy-ground-0fc2ab410.7.azurestaticapps.net",
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false
  }
};

// Scopes for basic user profile
export const loginRequest = {
  scopes: ["User.Read"]
};

// Scopes for Dataverse access
export const dataverseRequest = {
  scopes: ["https://arborfg.crm.dynamics.com/.default"]
};

export const DATAVERSE_URL = "https://arborfg.crm.dynamics.com";
