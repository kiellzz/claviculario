const state = {
    apiBase: localStorage.getItem("apiBase") || window.location.origin,
    token: localStorage.getItem("accessToken") || "",
    username: localStorage.getItem("username") || "",
    currentPage: "dashboard",
    cache: {},
    ws: null,
};

async function api(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(buildUrl(path), {
        ...options,
        headers
    });

    return response;
}