export async function apiPostRequest(endpoint: string, body: any) {
    console.log({
        ...body,
        token: localStorage.getItem("token") ?? ""
    })
    return fetch("http://127.0.0.1:3000/" + endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...body,
            token: localStorage.getItem("token") ?? ""
        }),
    })
}