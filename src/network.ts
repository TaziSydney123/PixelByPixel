export async function apiPostRequest(endpoint: string, body: any) {
    console.log({
        ...body,
        token: localStorage.getItem("token") ?? ""
    })
    return fetch("https://02e1bbb2-3787-4288-b170-ba378f39d7fa-00-34qdesqhukk3.kirk.replit.dev/" + endpoint, {
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