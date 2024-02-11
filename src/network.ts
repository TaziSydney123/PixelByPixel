export async function apiPostRequest(endpoint: string, body: any) {
    console.log({
        ...body,
        token: localStorage.getItem("token") ?? ""
    })
    return fetch("https://b87200fb-79c4-4af1-93b1-a175cf8c9f08-00-48nypzvf2h08.janeway.replit.dev/" + endpoint, {
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