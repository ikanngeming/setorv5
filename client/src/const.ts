export const getLoginUrl = (): string => {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!portalUrl || portalUrl === "undefined" || !appId || appId === "undefined") {
    console.warn("[Auth] VITE_OAUTH_PORTAL_URL or VITE_APP_ID is not set");
    return "/";
  }

  try {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const url = new URL(`${portalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", btoa(redirectUri));
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.error("[Auth] Failed to build login URL:", e);
    return "/";
  }
};
