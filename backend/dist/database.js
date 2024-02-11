"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getUsernameFromToken = exports.similarUsernames = exports.signInOrSignUp = exports.writePixel = exports.getCanvas = exports.getTurn = exports.getContacts = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient({
    datasourceUrl: 'postgresql://main:password@localhost:5432/pixelbypixel',
    // log: ['query', 'info', 'warn', 'error']
});
const canvasSize = 10;
const colorSubstringSize = 7;
const defaultCanvasColor = "#FFFFFF";
async function getContacts(username) {
    const canvases = await prisma.canvas.findMany({
        where: {
            users: {
                some: {
                    username: username
                }
            }
        },
        include: {
            turn: true,
            users: true
        }
    });
    console.log(canvases.map(canvas => canvas.users));
    return canvases.map(canvas => ({
        username: canvas.users.find(user => user.username != username)?.username,
        status: canvas.turnUsername == username ? "WAITING_SELF" : "WAITING_CONTACT"
    }));
}
exports.getContacts = getContacts;
async function getTurn(username, contact) {
    const canvas = await prisma.canvas.findFirst({
        where: {
            AND: [
                {
                    users: {
                        some: {
                            username: username
                        }
                    }
                },
                {
                    users: {
                        some: {
                            username: contact
                        }
                    }
                }
            ]
        },
        include: {
            turn: true
        }
    });
    if (canvas) {
        return canvas.turnUsername == username ? "WAITING_SELF" : "WAITING_CONTACT";
    }
    return null;
}
exports.getTurn = getTurn;
async function userExists(username) {
    return (await prisma.user.count({
        where: {
            "username": username
        }
    }) > 0);
}
async function canvasExists(usernameOne, usernameTwo) {
    return (await prisma.canvas.count({
        where: {
            AND: [
                {
                    users: {
                        some: {
                            username: usernameOne
                        }
                    }
                },
                {
                    users: {
                        some: {
                            username: usernameTwo
                        }
                    }
                }
            ]
        }
    })) > 0;
}
function canvasToDatabaseRepresentation(canvas) {
    let final = "";
    for (const row of canvas) {
        for (const cell of row) {
            final += cell;
        }
    }
    return final;
}
async function getCanvas(usernameOne, usernameTwo) {
    if (!await canvasExists(usernameOne, usernameTwo)) {
        return null;
    }
    let canvasContent = (await prisma.canvas.findFirst({
        where: {
            AND: [
                {
                    users: {
                        some: {
                            username: usernameOne
                        }
                    }
                },
                {
                    users: {
                        some: {
                            username: usernameTwo
                        }
                    }
                }
            ]
        }
    }))?.content;
    if (!canvasContent) {
        return null;
    }
    const canvas = new Array(canvasSize);
    for (let i = 0; i < canvasSize; i++) {
        canvas[i] = new Array(canvasSize);
        for (let k = 0; k < canvasSize; k++) {
            canvas[i][k] = "";
        }
    }
    const image = canvasContent.replaceAll('#', '');
    for (let i = 0; i < canvasSize * canvasSize; i++) {
        const color = image.substring(i * 6, (i + 1) * 6);
        const x = i % canvasSize;
        const y = Math.floor(i / canvasSize);
        canvas[y][x] = '#' + color;
    }
    return canvas;
}
exports.getCanvas = getCanvas;
async function createCanvasAndWritePixel(usernameOne, usernameTwo, pixelX, pixelY, color, usernameOneIsFinishedUsername = true) {
    const newUserWaitingOn = usernameOneIsFinishedUsername ? usernameTwo : usernameOne;
    const canvasPixels = new Array(canvasSize);
    for (let i = 0; i < canvasSize; i++) {
        canvasPixels[i] = new Array(canvasSize);
        for (let k = 0; k < canvasSize; k++) {
            canvasPixels[i][k] = defaultCanvasColor;
        }
    }
    canvasPixels[pixelX][pixelY] = color;
    console.log(usernameOne, " and ", usernameTwo, " made a canvas with waiting for ", newUserWaitingOn);
    const users = await prisma.user.findMany({
        where: {
            username: {
                in: [usernameOne, usernameTwo]
            }
        }
    });
    console.log(users);
    const turnUser = users.find(user => user.username == newUserWaitingOn);
    const r = await prisma.canvas.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            users: {
                connect: users.map(user => ({ username: user.username })),
            },
            content: canvasToDatabaseRepresentation(canvasPixels),
            turn: {
                connect: turnUser,
            }
        }
    });
    console.log(r);
}
async function writePixel(usernameOne, usernameTwo, pixelX, pixelY, color, usernameOneIsFinishedUsername = true) {
    const newUserWaitingOn = usernameOneIsFinishedUsername ? usernameTwo : usernameOne;
    if (!await canvasExists(usernameOne, usernameTwo)) {
        console.log('Canvas doesn\'t exist');
        console.log(usernameOne, usernameTwo);
        await createCanvasAndWritePixel(usernameOne, usernameTwo, pixelX, pixelY, color, usernameOneIsFinishedUsername);
        return true;
    }
    console.log('Canvas exists');
    const canvas = await getCanvas(usernameOne, usernameTwo);
    if (canvas === null) {
        return false;
    }
    canvas[pixelX][pixelY] = color;
    await updateCanvas(canvas, usernameOne, usernameTwo, newUserWaitingOn);
    return true;
}
exports.writePixel = writePixel;
async function updateCanvas(canvas, usernameOne, usernameTwo, newUserWaitingOn) {
    await prisma.canvas.updateMany({
        where: {
            AND: [
                {
                    users: {
                        some: {
                            username: usernameOne
                        }
                    },
                },
                {
                    users: {
                        some: {
                            username: usernameTwo
                        }
                    },
                }
            ]
        },
        data: {
            content: canvasToDatabaseRepresentation(canvas),
            turnUsername: newUserWaitingOn
        }
    });
}
async function signInOrSignUp(username, password) {
    if (await userExists(username)) {
        const savedPassword = (await prisma.user.findFirst({
            where: {
                username: username
            }
        }))?.password;
        if (password == savedPassword) {
            return await createUserToken(username);
        }
        return "";
    }
    await prisma.user.create({
        data: {
            username: username,
            password: password
        }
    });
    return await createUserToken(username);
}
exports.signInOrSignUp = signInOrSignUp;
async function similarUsernames(username) {
    const users = (await prisma.user.findMany({
        where: {
            username: {
                contains: username,
                mode: "insensitive"
            }
        }
    }));
    return users.map(user => user.username);
}
exports.similarUsernames = similarUsernames;
async function createUserToken(username) {
    const token = (0, crypto_1.randomUUID)();
    await prisma.token.create({
        data: {
            id: token,
            user: {
                connect: {
                    username: username
                }
            },
        }
    });
    return token;
}
async function getUsernameFromToken(token) {
    console.log(token);
    return (await prisma.user.findFirst({
        where: {
            tokens: {
                some: {
                    id: token
                }
            }
        },
        include: {
            tokens: true
        }
    }))?.username ?? "";
}
exports.getUsernameFromToken = getUsernameFromToken;
async function closeDatabase() {
    await prisma.$disconnect();
}
exports.closeDatabase = closeDatabase;
